import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_IDS, RUNTIMES } from './runtimes.js';
import { commandWithStdin, shellQuote } from './command.js';

test('every advertised runtime uses a fixed absolute file path', () => {
  assert.equal(new Set(LANGUAGE_IDS).size, LANGUAGE_IDS.length);
  for (const id of LANGUAGE_IDS) {
    const spec = RUNTIMES[id];
    assert.match(spec.file, /^[A-Za-z0-9_.-]+$/);
    assert.ok(Array.isArray(spec.run) && spec.run.length > 0, `${id} has a run command`);
    for (const argv of [spec.compile, spec.run].filter(Boolean)) {
      assert.ok(argv.every(value => typeof value === 'string' && !/[;|&`$]/.test(value)));
    }
  }
});

test('compiler and runtime commands never interpolate submitted source', () => {
  for (const spec of Object.values(RUNTIMES)) {
    for (const argv of [spec.compile, spec.run].filter(Boolean)) {
      assert.ok(argv.every(value => !value.includes('body.code')));
      assert.ok(!argv.some(value => value === '-c' || value === '-e'));
    }
  }
});

test('stdin is redirected from a fixed file and never becomes part of the shell command', () => {
  const argv = ['python3', '/workspace/main.py'];
  const command = commandWithStdin(argv);
  assert.deepEqual(command.slice(0, 2), ['/bin/bash', '-lc']);
  assert.match(command[2], /< \/workspace\/stdin\.txt$/);
  assert.match(command[2], /'python3' '\/workspace\/main\.py'/);
  assert.equal(command[2].includes('user input'), false);
});

test('shell quoting preserves spaces and embedded single quotes as literals', () => {
  assert.equal(shellQuote("/path/it's here"), "'/path/it'\\''s here'");
  assert.throws(() => commandWithStdin([]), TypeError);
});
