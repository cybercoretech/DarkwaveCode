import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const docsSource = await readFile(new URL('../docs-catalog.js', import.meta.url), 'utf8');
const catalogContext = vm.createContext({window:{}});
vm.runInContext(docsSource, catalogContext);
const docs = catalogContext.window.darkwaveDocsCatalog;

test('Docs Deck covers every selectable Workbench language exactly once', async () => {
  const workbench = await readFile(new URL('../workbench.html', import.meta.url), 'utf8');
  const languagePicker = workbench.match(/<select id="languageSelect"[\s\S]*?<\/select>/)?.[0] || '';
  const selectable = [...languagePicker.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
  assert.equal(selectable.length, 34);
  assert.equal(docs.length, 34);
  assert.deepEqual(Array.from(docs, doc => doc.key).sort(), [...selectable].sort());
});

test('DevDocs cards go to DevDocs and uncovered languages use official references', () => {
  assert.ok(docs.some(doc => doc.key === 'cpp' && doc.url === 'https://devdocs.io/cpp/'));
  assert.ok(docs.some(doc => doc.key === 'python' && doc.url === 'https://devdocs.io/python/'));
  for (const doc of docs) {
    assert.match(doc.url, /^https:\/\//);
    if (doc.provider === 'DevDocs') assert.equal(new URL(doc.url).hostname, 'devdocs.io');
    else assert.equal(doc.provider, 'Official');
    if (doc.official) assert.match(doc.official, /^https:\/\//);
  }
  assert.ok(docs.filter(doc => doc.provider === 'Official').length >= 10);
});

test('Docs Deck has theme, search, language context, and external-tab affordances', async () => {
  const html = await readFile(new URL('../docs.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../docs.js', import.meta.url), 'utf8');
  assert.match(html, /id="themeSelect"/);
  assert.match(html, /id="docsSearch"/);
  assert.match(html, /data-doc-filter="devdocs"/);
  assert.match(html, /id="docsContext"/);
  assert.match(script, /window\.open\(target, '_blank', 'noopener,noreferrer'\)/);
  assert.match(script, /doc\.key\.toLowerCase\(\) === requestedLanguage/);
  assert.match(script, /data\/cybergrid\.json/);
});

test('the main pages link to Docs Deck and Workbench reference follows selected language', async () => {
  for (const file of ['index.html','workbench.html','ghostkernel.html','community.html','templates.html','course.html','profile.html','vexlab.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /href="docs\.html">Docs Deck<\/a>/, `${file} should expose the Docs Deck`);
  }
  const workbench = await readFile(new URL('../workbench.html', import.meta.url), 'utf8');
  const engine = await readFile(new URL('../workbench-engine.js', import.meta.url), 'utf8');
  assert.match(workbench, /id="languageReference"/);
  assert.match(engine, /docs\.html\?lang=\$\{encodeURIComponent\(language\)\}/);
  assert.match(engine, /updateLanguageReference\(activeLanguage\)/);
});
