import { getSandbox, Sandbox as CloudflareSandbox } from '@cloudflare/sandbox';
import { DurableObject } from 'cloudflare:workers';
import { commandWithStdin } from './command.js';
import { LANGUAGE_IDS, RUNTIMES } from './runtimes.js';

export class CodeSandbox extends CloudflareSandbox {
  async start(options = {}) {
    return super.start({ ...options, enableInternet: false });
  }
}

const MAX_CODE_BYTES = 32 * 1024;
const MAX_STDIN_BYTES = 8 * 1024;
const MAX_OUTPUT_BYTES = 12 * 1024;
const RUN_TIMEOUT_MS = 8_000;
const RUNS_PER_MINUTE = 5;
const ALLOWED_ORIGINS = new Set([
  'https://darkwavecode.pages.dev',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

function responseHeaders(origin) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  return headers;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders(origin) });
}

async function limitForIp(env, ip) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip || 'unknown'));
  const key = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  const id = env.RUN_LIMITER.idFromName(key);
  return env.RUN_LIMITER.get(id).fetch('https://limiter/check', { method: 'POST' });
}

function takeOutput(process, remaining) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stdoutBytes = encoder.encode(process.stdout || '');
  const stderrBytes = encoder.encode(process.stderr || '');
  const stdout = decoder.decode(stdoutBytes.slice(0, remaining));
  const stdoutUsed = encoder.encode(stdout).length;
  const stderr = decoder.decode(stderrBytes.slice(0, Math.max(0, remaining - stdoutUsed)));
  return { stdout, stderr, truncated: Boolean(process.truncated) || stdoutBytes.length + stderrBytes.length > remaining };
}

async function runProcess(sandbox, argv, env = {}, withStdin = false) {
  const process = await sandbox.exec(withStdin ? commandWithStdin(argv) : argv, { cwd: '/workspace', env, timeout: RUN_TIMEOUT_MS });
  return process.output({ encoding: 'utf8', maxBytes: MAX_OUTPUT_BYTES, timeout: RUN_TIMEOUT_MS + 5_000 });
}

export class RunLimiter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async fetch(request) {
    const now = Date.now();
    const timestamps = (await this.ctx.storage.get('runs')) || [];
    const recent = timestamps.filter(time => time > now - 60_000);
    if (recent.length >= RUNS_PER_MINUTE) {
      return Response.json({ allowed: false, retryAfter: Math.max(1, Math.ceil((recent[0] + 60_000 - now) / 1_000)) }, { status: 429 });
    }
    recent.push(now);
    await this.ctx.storage.put('runs', recent);
    return Response.json({ allowed: true });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    if (request.method === 'OPTIONS') {
      const headers = responseHeaders(origin);
      if (ALLOWED_ORIGINS.has(origin)) {
        headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
        headers.set('access-control-allow-headers', 'content-type');
        headers.set('access-control-max-age', '600');
      }
      return new Response(null, { status: 204, headers });
    }
    if (url.pathname === '/healthz' && request.method === 'GET') return json({ ok: true }, 200, origin);
    if (url.pathname === '/v1/runtimes' && request.method === 'GET') {
      return json({ runtimes: LANGUAGE_IDS.map(id => ({ id, label: RUNTIMES[id].label })) }, 200, origin);
    }
    if (url.pathname !== '/v1/run' || request.method !== 'POST') return json({ error: 'Not found' }, 404, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'This origin is not allowed.' }, 403, origin);
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_CODE_BYTES + MAX_STDIN_BYTES + 2_048) return json({ error: 'Request is too large. Code is limited to 32 KB and standard input to 8 KB.' }, 413, origin);

    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_CODE_BYTES + MAX_STDIN_BYTES + 2_048) return json({ error: 'Request is too large.' }, 413, origin);
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'Send a valid JSON request.' }, 400, origin);
    }
    if (!body || typeof body !== 'object' || typeof body.code !== 'string' || typeof body.language !== 'string') {
      return json({ error: 'Both language and code are required.' }, 400, origin);
    }
    const spec = RUNTIMES[body.language];
    if (!spec) return json({ error: 'No compiler is enabled for that language.' }, 400, origin);
    if (new TextEncoder().encode(body.code).length > MAX_CODE_BYTES) return json({ error: 'Code is limited to 32 KB.' }, 413, origin);
    if (body.code.includes('\0')) return json({ error: 'Source code cannot contain a null byte.' }, 400, origin);
    const stdin = body.stdin === undefined ? '' : body.stdin;
    if (typeof stdin !== 'string') return json({ error: 'Standard input must be text.' }, 400, origin);
    if (new TextEncoder().encode(stdin).length > MAX_STDIN_BYTES) return json({ error: 'Standard input is limited to 8 KB.' }, 413, origin);
    if (stdin.includes('\0')) return json({ error: 'Standard input cannot contain a null byte.' }, 400, origin);

    const rate = await limitForIp(env, request.headers.get('cf-connecting-ip') || 'unknown');
    if (rate.status === 429) return json({ error: 'Run limit reached (5 per minute). Try again shortly.' }, 429, origin);

    const id = `job-${crypto.randomUUID()}`;
    const sandbox = getSandbox(env.Sandbox, id, { normalizeId: true, sleepAfter: '1s' });
    const startedAt = Date.now();
    let status = 'success';
    let stdout = '';
    let stderr = '';
    let truncated = false;
    let exitCode = 0;
    try {
      await sandbox.writeFile(`/workspace/${spec.file}`, body.code);
      await sandbox.writeFile('/workspace/stdin.txt', stdin);
      if (spec.compile) {
        const compile = await runProcess(sandbox, spec.compile, spec.env);
        const compileOutput = takeOutput(compile, MAX_OUTPUT_BYTES);
        stdout += compileOutput.stdout;
        stderr += compileOutput.stderr;
        truncated ||= compileOutput.truncated;
        if (compile.timedOut) status = 'timeout';
        else if (compile.exitCode !== 0) status = 'compile_error';
        if (status !== 'success') exitCode = compile.exitCode;
      }
      if (status === 'success') {
        const result = await runProcess(sandbox, spec.run, spec.env, true);
        const remaining = Math.max(0, MAX_OUTPUT_BYTES - new TextEncoder().encode(stdout + stderr).length);
        const runtimeOutput = takeOutput(result, remaining);
        stdout += runtimeOutput.stdout;
        stderr += runtimeOutput.stderr;
        truncated ||= runtimeOutput.truncated;
        exitCode = result.exitCode;
        if (result.timedOut) status = 'timeout';
        else if (result.exitCode !== 0) status = 'runtime_error';
      }
    } catch (error) {
      status = 'runner_error';
      stderr = 'The isolated runtime could not complete this run. Please retry.';
      exitCode = 1;
      console.error('Compiler sandbox failed', error instanceof Error ? error.name : 'unknown');
    } finally {
      try { await sandbox.destroy(); } catch (error) { console.error('Sandbox cleanup failed', error instanceof Error ? error.name : 'unknown'); }
    }

    return json({ status, exitCode, stdout, stderr, truncated, elapsedMs: Date.now() - startedAt }, 200, origin);
  },
};
