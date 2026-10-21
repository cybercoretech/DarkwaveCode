(() => {
  const editor = document.querySelector('#codeEditor');
  if (!editor) return;
  window.DARKWAVE_WORKBENCH_UPGRADES = true;
  const $ = selector => document.querySelector(selector);
  const languageSelect = $('#languageSelect');
  const languageReference = $('#languageReference');
  const templateReference = $('#templateReference');
  const stdinInput = $('#stdinInput');
  const output = $('#output');
  const runState = $('#runState');
  const frame = $('#previewFrame');
  const {starter, templates} = window.darkwaveStarterTemplates;
  const files = {c:'main.c',cpp:'main.cpp',python:'main.py',javascript:'main.js',rust:'main.rs',go:'main.go',java:'Main.java',typescript:'main.ts',sql:'main.sql',bash:'main.sh',csharp:'Program.cs',powershell:'main.ps1',php:'main.php',kotlin:'Main.kt',lua:'main.lua',assembly:'main.asm',swift:'main.swift',ruby:'main.rb',dart:'main.dart',r:'main.R',htmlcss:'index.html',zig:'main.zig',scala:'Main.scala',julia:'main.jl',perl:'main.pl',haskell:'Main.hs',clojure:'main.clj',crystal:'main.cr',elixir:'main.exs',elm:'Main.elm',erlang:'main.erl',groovy:'Main.groovy',purescript:'Main.purs',vex:'main.vex'};
  const webDefaults = {
    html: '<main class="signal-card">\n  <p class="eyebrow">DARKWAVE / WEB STUDIO</p>\n  <h1>Signal received.</h1>\n  <p>Edit the HTML, CSS, and JavaScript files, then run the preview.</p>\n  <button id="pulse">SEND A PULSE</button>\n  <output id="status">Awaiting signal</output>\n</main>',
    css: 'body { min-height: 100vh; display: grid; place-items: center; margin: 0; background: #080910; color: #e9f2f6; font: 16px system-ui; }\n.signal-card { max-width: 42rem; padding: 2rem; border: 1px solid #21e6ff; background: #0e131d; box-shadow: 0 0 40px #21e6ff22; }\n.eyebrow { color: #21e6ff; font: 11px monospace; letter-spacing: .18em; }\nh1 { color: #c3ff00; }\nbutton { padding: .8rem 1rem; border: 0; background: #c3ff00; color: #080910; font-weight: 800; cursor: pointer; }\noutput { display: block; margin-top: 1rem; color: #ff2f9f; }',
    js: 'document.querySelector("#pulse").addEventListener("click", () => {\n  document.querySelector("#status").textContent = "Pulse acknowledged at " + new Date().toLocaleTimeString();\n  console.log("Signal sent.");\n});'
  };
  const webKey = file => `darkwavecode-web:${file}`;
  let webFiles = {};
  for (const file of ['html','css','js']) {
    try { webFiles[file] = localStorage.getItem(webKey(file)) ?? webDefaults[file]; } catch { webFiles[file] = webDefaults[file]; }
  }
  let activeWebFile = 'html';
  const params = new URLSearchParams(location.search);
  const imported = (() => {
    try { return JSON.parse(sessionStorage.getItem('darkwavecode-template-import') || 'null'); } catch { return null; }
  })();
  if (imported) sessionStorage.removeItem('darkwavecode-template-import');
  const courseMission = (() => {
    try { const mission = JSON.parse(sessionStorage.getItem('darkwavecode-course-mission') || 'null'); sessionStorage.removeItem('darkwavecode-course-mission'); return mission; } catch { return null; }
  })();
  let shared = null;
  if (location.hash.startsWith('#share=')) {
    try {
      const encoded = location.hash.slice(7).replaceAll('-', '+').replaceAll('_', '/');
      const binary = atob(encoded + '='.repeat((4 - encoded.length % 4) % 4));
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      shared = JSON.parse(new TextDecoder().decode(bytes));
      history.replaceState(null, '', location.pathname + location.search);
    } catch { output.textContent = 'This share link is invalid or incomplete.'; }
  }
  const validLanguage = language => [...languageSelect.options].some(option => option.value === language);
  if (shared && validLanguage(shared.language)) languageSelect.value = shared.language;
  else if (imported && validLanguage(imported.language)) languageSelect.value = imported.language;
  else if (courseMission && validLanguage(courseMission.language)) languageSelect.value = courseMission.language;
  else if (validLanguage(params.get('lang'))) languageSelect.value = params.get('lang');
  let activeLanguage = languageSelect.value;
  const updateLanguageReference = language => {
    if (languageReference) {
      languageReference.href = `docs.html?lang=${encodeURIComponent(language)}`;
      languageReference.textContent = `${language === 'htmlcss' ? 'WEB' : language.toUpperCase()} REFERENCE ↗`;
    }
    if (templateReference) templateReference.href = `templates.html?lang=${encodeURIComponent(language)}`;
  };
  updateLanguageReference(activeLanguage);
  if (shared?.files && activeLanguage === 'htmlcss') webFiles = {...webFiles, ...shared.files};
  const loadDraft = language => {
    if (language === 'htmlcss') return webFiles[activeWebFile];
    try { return localStorage.getItem(`darkwavecode-draft:${language}`) || (language === 'javascript' ? localStorage.getItem('darkwavecode-draft') : null) || templates[language] || ''; }
    catch { return templates[language] || ''; }
  };
  editor.value = shared && typeof shared.code === 'string' ? shared.code : imported && typeof imported.code === 'string' ? imported.code : courseMission && typeof courseMission.code === 'string' ? courseMission.code : loadDraft(activeLanguage) || starter;
  if (activeLanguage === 'htmlcss' && !shared?.code && !imported?.code && !courseMission) editor.value = webFiles.html;
  if (shared?.files && activeLanguage === 'htmlcss') editor.value = webFiles[activeWebFile];
  try { stdinInput.value = localStorage.getItem('darkwavecode-stdin') || ''; } catch { stdinInput.value = ''; }
  const updateLines = () => { $('#lineNumbers').textContent = Array.from({length: editor.value.split('\n').length}, (_,i) => i + 1).join('\n'); };
  const paint = () => {
    const fileLanguage = activeLanguage === 'htmlcss' ? ({html:'htmlcss',css:'css',js:'javascript'}[activeWebFile]) : activeLanguage;
    $('#syntaxLayer').innerHTML = window.darkwaveHighlight(editor.value, fileLanguage);
    updateLines();
  };
  if (courseMission) {
    $('.brief-content .chip').textContent = `${String(courseMission.track || 'COURSE').toUpperCase()} · FOUNDATION MISSION`;
    $('.brief-content h3').textContent = courseMission.title || 'Learning track mission';
    $('.brief-description').textContent = 'Mission loaded from your learning track. Edit the starter, run it here when this language has a local runtime, and keep exploring.';
    runState.textContent = 'COURSE MISSION LOADED';
  }
  const fileTab = (language, file = activeWebFile) => {
    const name = language === 'htmlcss' ? ({html:'index.html',css:'styles.css',js:'app.js'}[file]) : files[language] || `${language}.txt`;
    $('.file-tab').innerHTML = `<span class="file-icon">${language === 'python' ? 'Py' : language === 'htmlcss' ? file.toUpperCase() : language[0].toUpperCase()}</span> ${name} <b>●</b>`;
  };
  const webTabs = $('#webStudioTabs');
  const preview = $('#webPreview');
  const tabButtons = [...webTabs.querySelectorAll('[data-web-file]')];
  const setWebMode = enabled => { webTabs.hidden = !enabled; if (!enabled) preview.hidden = true; else fileTab('htmlcss'); };
  setWebMode(activeLanguage === 'htmlcss');
  if (activeLanguage !== 'htmlcss') fileTab(activeLanguage);
  paint();

  let draftTimer, isRunning = false;
  const saveDraft = () => {
    clearTimeout(draftTimer);
    const value = editor.value, language = activeLanguage, webFile = activeWebFile;
    runState.textContent = 'SAVING LOCALLY…';
    draftTimer = setTimeout(() => {
      try {
        if (language === 'htmlcss') { webFiles[webFile] = value; localStorage.setItem(webKey(webFile), value); }
        else localStorage.setItem(`darkwavecode-draft:${language}`, value);
        if (!isRunning && runState.textContent === 'SAVING LOCALLY…') runState.textContent = 'LOCAL DRAFT SAVED';
      } catch { runState.textContent = 'LOCAL STORAGE UNAVAILABLE'; }
    }, 250);
  };
  editor.addEventListener('input', () => { paint(); saveDraft(); });
  editor.addEventListener('scroll', () => { $('#lineNumbers').scrollTop = editor.scrollTop; });
  editor.addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end'); editor.dispatchEvent(new Event('input', {bubbles:true})); }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runCode(); }
  });
  for (const button of tabButtons) button.addEventListener('click', () => {
    if (activeLanguage !== 'htmlcss' || activeWebFile === button.dataset.webFile) return;
    webFiles[activeWebFile] = editor.value;
    try { localStorage.setItem(webKey(activeWebFile), editor.value); } catch {}
    activeWebFile = button.dataset.webFile;
    tabButtons.forEach(tab => tab.classList.toggle('active', tab === button));
    editor.value = webFiles[activeWebFile]; fileTab('htmlcss'); paint(); editor.focus();
  });
  languageSelect.addEventListener('change', event => {
    clearTimeout(draftTimer);
    if (activeLanguage === 'htmlcss') { webFiles[activeWebFile] = editor.value; try { localStorage.setItem(webKey(activeWebFile), editor.value); } catch {} }
    else { try { localStorage.setItem(`darkwavecode-draft:${activeLanguage}`, editor.value); } catch {} }
    activeLanguage = event.target.value;
    updateLanguageReference(activeLanguage);
    setWebMode(activeLanguage === 'htmlcss');
    fileTab(activeLanguage);
    editor.value = loadDraft(activeLanguage) || (activeLanguage === 'javascript' ? starter : '');
    paint(); updateRuntimeMode();
  });
  let cloudRuntimes = new Set();
  function updateRuntimeMode() {
    const lang = languageSelect.value;
    const local = window.darkwaveLocalRuntimeIds?.includes(lang);
    const cloud = cloudRuntimes.has(lang);
    $('#runtimeMode').textContent = local ? (lang === 'htmlcss' ? 'WEB STUDIO · PREVIEW' : `${lang.toUpperCase()} · LOCAL`) : cloud ? `${lang.toUpperCase()} · CLOUD SANDBOX` : `${lang.toUpperCase()} · TEMPLATE ONLY`;
    const mode = local ? (lang === 'htmlcss' ? 'RESTRICTED PREVIEW' : lang === 'vex' ? 'LOCAL WASM WORKER' : lang === 'javascript' ? 'LOCAL WORKER' : 'ISOLATED FRAME') : cloud ? 'CLOUD SANDBOX' : 'TEMPLATE ONLY';
    $('#runtimeScope').textContent = mode;
    $('#stdinStatus').textContent = cloud ? 'runtime input · saved locally' : lang === 'python' ? 'Python input() · saved locally' : 'Python only · saved locally';
  }
  async function loadCloudRuntimes() {
    const config = window.DARKWAVE_RUNNER || {};
    if (config.url) {
      try { const response = await fetch(`${config.url}/v1/runtimes`); if (response.ok) { const data = await response.json(); cloudRuntimes = new Set((data.runtimes || []).map(runtime => runtime.id)); } } catch {}
    }
    updateRuntimeMode();
  }
  document.addEventListener('darkwave:site-config', loadCloudRuntimes);
  function recordRun(language, success, durationMs) { fetch('/api/telemetry', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'run',label:language,success,durationMs}),keepalive:true}).catch(()=>{}); }
  let stopPreviewListener = null;
  function runWeb() {
    webFiles[activeWebFile] = editor.value;
    stopPreviewListener?.();
    const stopListening = window.darkwavePreviewWeb({html:webFiles.html,css:webFiles.css,js:webFiles.js,frame,onOutput:text=>{output.textContent+=text;}});
    stopPreviewListener = stopListening;
    preview.hidden = false;
    $('#previewFrame').style.width = $('#previewViewport').value;
    $('#previewFrame').style.maxWidth = '100%';
    return stopListening;
  }
  async function runCode() {
    const language = languageSelect.value;
    const button = $('#runCode');
    const start = performance.now();
    if (language === 'htmlcss') {
      output.textContent = 'Preview logs and browser errors appear here. Network access is disabled inside the preview.\n';
      runState.textContent = 'RENDERING ISOLATED WEB PREVIEW…';
      runWeb(); runState.textContent = 'WEB PREVIEW READY'; recordRun(language, true, performance.now() - start); return;
    }
    const source = editor.value;
    if (!source.trim()) { output.textContent = 'Editor is empty. Add code, then run again.'; runState.textContent = 'NOTHING TO RUN'; return; }
    isRunning = true; button.disabled = true; output.textContent = ''; runState.textContent = 'STARTING LOCAL RUNTIME…';
    let success = false;
    try {
      if (language === 'javascript') {
        if (stdinInput.value.trim()) output.textContent = 'Note: the JavaScript sandbox does not read standard input yet.\n';
        await window.darkwaveRunJavaScript(source, text => { output.textContent += text; });
        runState.textContent = 'EXECUTION COMPLETE';
      } else if (window.darkwaveLocalRuntimeIds?.includes(language)) {
        if (language === 'lua' && stdinInput.value.trim()) output.textContent = 'Note: standard input is not wired for Lua yet.\n';
        await window.darkwaveRunLocalRuntime(language, source, stdinInput.value, text => { output.textContent += text; });
        runState.textContent = `${language.toUpperCase()} · LOCAL RUN COMPLETE`;
      } else if (cloudRuntimes.has(language) && window.DARKWAVE_RUNNER?.url) {
        runState.textContent = 'STARTING REMOTE SANDBOX…';
        const response = await fetch(`${window.DARKWAVE_RUNNER.url}/v1/run`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language,code:source,stdin:stdinInput.value})});
        const result = await response.json();
        if (!response.ok) throw Error(result.error || `Compiler service returned ${response.status}.`);
        output.textContent = [result.stdout,result.stderr].filter(Boolean).join('') || `Program finished with no output.\nExit code: ${result.exitCode}`;
        runState.textContent = result.status === 'success' ? `EXECUTION COMPLETE · ${result.elapsedMs} MS` : result.status.replaceAll('_',' ').toUpperCase();
      } else {
        output.textContent = `${language.toUpperCase()} is ready for editing, syntax highlighting, and template work. Its compiler/runtime is not connected yet, so this code is not executed.`;
        runState.textContent = 'TEMPLATE ONLY';
      }
      if (!output.textContent) output.textContent = 'Program finished with no output.';
      success = true;
    } catch (error) { output.textContent += `${output.textContent ? '\n' : ''}${error.message}`; runState.textContent = 'RUN STOPPED'; }
    finally { isRunning = false; button.disabled = false; recordRun(language, success, performance.now() - start); }
  }
  $('#runCode').addEventListener('click', runCode);
  $('#copyOutput').addEventListener('click', async () => {
    if (!output.textContent.trim()) { runState.textContent = 'NO OUTPUT TO COPY'; return; }
    try { await navigator.clipboard.writeText(output.textContent); runState.textContent = 'OUTPUT COPIED'; }
    catch { runState.textContent = 'CLIPBOARD BLOCKED · SELECT OUTPUT TO COPY'; }
  });
  $('#clearOutput').addEventListener('click', () => { output.textContent = 'Console cleared. Your source remains saved locally.'; runState.textContent = 'WAITING FOR RUN'; });
  $('#resetCode').addEventListener('click', () => {
    if (!confirm('Reset this local draft to the starter template?')) return;
    if (activeLanguage === 'htmlcss') { webFiles = {...webDefaults}; for (const file of Object.keys(webFiles)) try { localStorage.removeItem(webKey(file)); } catch {} editor.value = webFiles[activeWebFile]; }
    else { try { localStorage.removeItem(`darkwavecode-draft:${activeLanguage}`); } catch {} editor.value = templates[activeLanguage] || starter; }
    paint(); runState.textContent = 'LOCAL DRAFT RESET';
  });
  $('#previewViewport').addEventListener('change', event => { $('#previewFrame').style.width = event.target.value; });
  $('#refreshPreview').addEventListener('click', () => { output.textContent = ''; runWeb(); runState.textContent = 'WEB PREVIEW REFRESHED'; });
  $('#shareCode').addEventListener('click', async () => {
    if (activeLanguage === 'htmlcss') webFiles[activeWebFile] = editor.value;
    const data = {v:1,language:activeLanguage,...(activeLanguage === 'htmlcss' ? {files:webFiles} : {code:editor.value})};
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
    const link = `${location.origin}${location.pathname}#share=${btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}`;
    if (link.length > 90000) { runState.textContent = 'SHARE LINK TOO LARGE · EXPORT FROM TEMPLATES'; return; }
    try { await navigator.clipboard.writeText(link); runState.textContent = 'SHARE LINK COPIED · PUBLIC TO ANYONE WITH THE URL'; }
    catch { window.prompt('Copy this link. Anyone who has it can read the included code:', link); runState.textContent = 'SHARE LINK READY'; }
  });
  $('#saveTemplate').addEventListener('click', () => {
    const code = activeLanguage === 'htmlcss'
      ? `${webFiles.html}\n<style>\n${webFiles.css}\n</style>\n<script>\n${webFiles.js}\n</script>`
      : editor.value;
    try {
      sessionStorage.setItem('darkwavecode-template-seed', JSON.stringify({title:`${activeLanguage === 'htmlcss' ? 'Web Studio' : activeLanguage.toUpperCase()} · local draft`,language:activeLanguage,description:'Saved from the DarkwaveCode Workbench. Private to this browser until exported.',code}));
      location.href = 'templates.html#builder';
    } catch { runState.textContent = 'COULD NOT OPEN TEMPLATE VAULT'; }
  });
  $('#collapseProblem').addEventListener('click', () => $('#workbenchPanel').classList.toggle('collapsed'));
  const splitter = $('#splitter'); let drag = null;
  splitter.addEventListener('pointerdown', event => { drag={x:event.clientX,width:$('#problemPane').getBoundingClientRect().width}; splitter.setPointerCapture(event.pointerId); });
  splitter.addEventListener('pointermove', event => { if (!drag) return; const panel=$('#workbenchPanel'),rect=panel.getBoundingClientRect(),width=Math.max(230,Math.min(rect.width*.6,drag.width+event.clientX-drag.x));panel.style.setProperty('--problem-width',`${width}px`); });
  splitter.addEventListener('pointerup', () => drag=null);
  splitter.addEventListener('keydown', event => { if (!['ArrowLeft','ArrowRight'].includes(event.key)) return; event.preventDefault(); const width=$('#problemPane').getBoundingClientRect().width+(event.key==='ArrowRight'?24:-24);$('#workbenchPanel').style.setProperty('--problem-width',`${Math.max(230,width)}px`); });
  stdinInput.addEventListener('input', () => { try { localStorage.setItem('darkwavecode-stdin', stdinInput.value); } catch {} });
  updateRuntimeMode(); loadCloudRuntimes();
})();
