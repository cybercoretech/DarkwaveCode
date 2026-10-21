import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function editorContext(){
  const context={window:{},document:{querySelector(){return null}}};vm.createContext(context);
  for(const file of ['language-templates.js','starter-templates.js','syntax-highlighting.js'])vm.runInContext(await readFile(new URL(`../${file}`,import.meta.url),'utf8'),context);
  return context;
}

test('template vault includes a starter for every selectable workbench language',async()=>{
 const context=await editorContext(),templates=context.window.darkwaveStarterTemplates.templates;
 const expected=['c','cpp','python','javascript','rust','go','java','typescript','sql','bash','csharp','powershell','php','kotlin','lua','assembly','swift','ruby','dart','r','htmlcss','zig','scala','julia','perl','haskell','clojure','crystal','elixir','elm','erlang','groovy','purescript'];
 assert.deepEqual(Object.keys(templates).sort(),expected.sort());
 for(const [language,source]of Object.entries(templates))assert.ok(source.trim(),`${language} has a non-empty starter`);
});

test('syntax highlighter colors code tokens and safely escapes source text',async()=>{
 const context=await editorContext(),highlight=context.window.darkwaveHighlight;
 const rendered=highlight('const greeting = "hello"; // note\nconsole.log(greeting);','javascript');
 assert.match(rendered,/class="syn-keyword"/);assert.match(rendered,/class="syn-string"/);assert.match(rendered,/class="syn-comment"/);assert.match(rendered,/class="syn-function"/);
 const hostile=highlight('</span><script>alert(1)</script>','javascript');assert.ok(!hostile.includes('<script>'));assert.ok(hostile.includes('&lt;'));
});

test('Workbench keeps runtime-unavailable languages selectable as templates',async()=>{
 const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/option\.disabled=option\.hidden/);
 assert.match(app,/TEMPLATE ONLY/);
 assert.match(app,/darkwavecode-draft:\$\{language\}/);
});

test('Workbench keeps the full starter shelf and describes local runtime limits',async()=>{
 const html=await readFile(new URL('../workbench.html',import.meta.url),'utf8');
 for(const language of ['javascript','python','c','cpp','java','go','rust','sql','bash','lua','typescript','htmlcss','csharp','powershell','php','kotlin','assembly','swift','ruby','dart','r','zig','scala','julia','perl','haskell','clojure','crystal','elixir','elm','erlang','groovy','purescript'])assert.match(html,new RegExp(`value="${language}"`));
 assert.match(html,/JavaScript, Python, Lua, SQL, and the Web Studio run locally/i);
 assert.match(html,/other languages are editable templates until a runtime is connected/i);
 assert.match(html,/shareCode/);assert.match(html,/saveTemplate/);assert.match(html,/webStudioTabs/);assert.match(html,/previewFrame/);
 const worker=await readFile(new URL('../_worker.js',import.meta.url),'utf8');
 assert.match(worker,/visibleLanguages:\[\.\.\.LANGUAGE_IDS\]/);
});

test('local runtimes are pinned, lazy, and isolated with bounded output and time',async()=>{
 const source=await readFile(new URL('../local-runtimes.js',import.meta.url),'utf8');
 assert.match(source,/pyodide\/v314\.0\.7/);assert.match(source,/fengari-web@0\.1\.4/);assert.match(source,/sql\.js@1\.13\.0/);
 assert.match(source,/setAttribute\('sandbox', 'allow-scripts'\)/);assert.match(source,/MAX_OUTPUT = 12000/);assert.match(source,/timeoutMs = language === 'python' \? 45000/);
 assert.match(source,/language === 'lua' \? "'unsafe-eval'"/);assert.match(source,/language === 'lua' \? "'none'"/);
 assert.match(source,/darkwaveLocalRuntimeIds = \['javascript', 'htmlcss', 'python', 'lua', 'sql'\]/);
});

test('Web Studio preview permits local inline projects but blocks network and parent access',async()=>{
 const context={window:{addEventListener(){},removeEventListener(){}}};vm.createContext(context);
 vm.runInContext(await readFile(new URL('../web-preview.js',import.meta.url),'utf8'),context);
 const frame={setAttribute(name,value){this[name]=value}};
 context.window.darkwavePreviewWeb({html:'<h1>Local</h1>',css:'h1 { color: red; }',js:'const valid = 1 < 2; console.log(valid);',frame,onOutput(){}});
 assert.equal(frame.sandbox,'allow-scripts');assert.match(frame.srcdoc,/connect-src 'none'/);assert.match(frame.srcdoc,/const valid = 1 < 2/);assert.match(frame.srcdoc,/console\.log/);
});

test('foundation lessons can open missions and reveal hints',async()=>{
 const html=await readFile(new URL('../course.html',import.meta.url),'utf8'),script=await readFile(new URL('../course.js',import.meta.url),'utf8');
 assert.match(html,/id="openMission"/);assert.match(html,/id="revealHint"/);assert.match(script,/darkwavecode-course-mission/);assert.match(script,/location\.href = 'workbench\.html\?from=course'/);
});
