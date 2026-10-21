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

test('Workbench keeps all language templates available and identifies local runtime limits',async()=>{
 const html=await readFile(new URL('../workbench.html',import.meta.url),'utf8');
 for(const language of ['javascript','python','c','cpp','java','go','rust','sql','bash','lua','typescript','htmlcss','csharp','powershell','php','kotlin','assembly','swift','ruby','dart','r','zig','scala','julia','perl','haskell','clojure','crystal','elixir','elm','erlang','groovy','purescript'])assert.match(html,new RegExp(`value="${language}"`));
 assert.match(html,/template-only until a compiler service is connected/i);
 const worker=await readFile(new URL('../_worker.js',import.meta.url),'utf8');
 assert.match(worker,/visibleLanguages:\[\.\.\.LANGUAGE_IDS\]/);
});
