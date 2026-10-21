import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('Vex Language Lab provides a template-only Workbench handoff and honest runtime state', async () => {
  const page = await readFile(new URL('../vexlab.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../vexlab.js', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../workbench.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.ok(page.includes('BROWSER RUNNER</dt><dd>NOT CONNECTED'));
  assert.ok(page.includes('QBE output is experimental intermediate code'));
  assert.ok(editor.includes('value="vex">Vex</option>'));
  assert.ok(editor.includes('id="languageReference"'));
  assert.ok(app.includes("vex:'main.vex'"));
  assert.ok(script.includes("language: 'vex'"));
  assert.ok(script.includes('workbench.html?from=vexlab'));
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
  assert.ok(admin.includes("vex:'Vex · template only'"));
  assert.ok(admin.includes("vex:'Vex Language Lab'"));
  assert.ok(controls.includes("vexlab:'vexlab.html'"));
});
