import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('Vex Language Lab provides local WASM execution and a Workbench handoff', async () => {
  const page = await readFile(new URL('../vexlab.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../vexlab.js', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../workbench.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const runtime = await readFile(new URL('../local-runtimes.js', import.meta.url), 'utf8');
  const worker = await readFile(new URL('../vex-worker.js', import.meta.url), 'utf8');
  assert.ok(page.includes('RUN IN BROWSER'));
  assert.ok(page.includes('BROWSER RUNNER</dt><dd>LOCAL WASM'));
  assert.ok(page.includes('QBE output remains experimental intermediate code'));
  assert.ok(editor.includes('value="vex">Vex</option>'));
  assert.ok(editor.includes('id="languageReference"'));
  assert.ok(app.includes("vex:'main.vex'"));
  assert.ok(script.includes("language: 'vex'"));
  assert.ok(script.includes('workbench.html?from=vexlab'));
  assert.ok(runtime.includes("'vex']"));
  assert.ok(runtime.includes('12000'));
  assert.ok(worker.includes("./vex-runtime/vexlang.js"));
  const workflow = await readFile(new URL('../.github/workflows/pages-deploy.yml', import.meta.url), 'utf8');
  assert.ok(workflow.includes('./vex-runtime'));
  assert.ok(runtime.includes("source.length > 64000"));
  assert.ok(runtime.includes("'vex was stopped after 12 seconds.".toLowerCase()) || runtime.includes('Vex was stopped after 12 seconds.'));
});

test('Vex course has three substantive modules and matching starter source', async () => {
  const coursesContext = vm.createContext({window:{}});
  const starterContext = vm.createContext({window:{darkwaveExtraLanguages:{}}});
  vm.runInContext(await readFile(new URL('../courses.js', import.meta.url), 'utf8'), coursesContext);
  vm.runInContext(await readFile(new URL('../starter-templates.js', import.meta.url), 'utf8'), starterContext);
  const track = coursesContext.window.darkwaveCourses.vex;
  const template = starterContext.window.darkwaveStarterTemplates.templates.vex;
  assert.equal(track.lessons.length, 3);
  assert.ok(track.lessons.every(lesson => lesson.example.trim()));
  assert.match(template, /let signal: i32/);
});

test('Vex is represented in language visibility, admin controls, course visibility, and telemetry routes', async () => {
  const worker = await readFile(new URL('../_worker.js', import.meta.url), 'utf8');
  const admin = await readFile(new URL('../admin.js', import.meta.url), 'utf8');
  const controls = await readFile(new URL('../site-controls.js', import.meta.url), 'utf8');
  assert.ok(worker.includes("'vex']"));
  assert.ok(worker.includes("'PureScript','Vex'"));
  assert.ok(admin.includes("vex:'Vex · local WASM'"));
  assert.ok(admin.includes("vex:'Vex Language Lab'"));
  assert.ok(controls.includes("vexlab:'vexlab.html'"));
});
