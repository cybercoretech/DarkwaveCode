/* Optional browser runtimes. User programs run in disposable, opaque-origin frames. */
(() => {
  const MAX_OUTPUT = 12000;
  const deps = {
    python: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js',
    pythonBase: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',
    lua: 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.min.js',
    sql: 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js',
    sqlBase: 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/'
  };
  const safeJSON = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

  function runInFrame(language, source, stdin, onOutput) {
    return new Promise((resolve, reject) => {
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const frame = document.createElement('iframe');
      frame.title = `${language} local runtime sandbox`;
      frame.setAttribute('sandbox', 'allow-scripts');
      Object.assign(frame.style, {position:'fixed',left:'-20px',bottom:'0',width:'1px',height:'1px',opacity:'0',border:'0',pointerEvents:'none'});
      let outputSize = 0, ended = false;
      const timeoutMs = language === 'python' ? 45000 : language === 'sql' ? 18000 : 10000;
      const finish = error => {
        if (ended) return;
        ended = true;
        clearTimeout(timer);
        window.removeEventListener('message', receive);
        frame.remove();
        error ? reject(error) : resolve();
      };
      const receive = event => {
        if (event.source !== frame.contentWindow || event.data?.token !== token || ended) return;
        if (event.data.type === 'output') {
          const remaining = MAX_OUTPUT - outputSize;
          if (remaining > 0) {
            const text = String(event.data.text ?? '').slice(0, remaining);
            outputSize += text.length;
            onOutput(text);
          }
          if (outputSize >= MAX_OUTPUT) finish(new Error('Output limit reached (12 KB).'));
        } else if (event.data.type === 'done') finish();
        else if (event.data.type === 'failed') finish(new Error(String(event.data.text || 'Runtime failed.').slice(0, 3000)));
      };
      const timer = setTimeout(() => finish(new Error(`${language.toUpperCase()} stopped after ${timeoutMs / 1000} seconds. Check for an infinite loop or a slow first runtime download.`)), timeoutMs);
      window.addEventListener('message', receive);
      const payload = safeJSON({token, source, stdin});
      const csp = `default-src 'none'; script-src 'unsafe-inline' ${language === 'lua' ? "'unsafe-eval'" : ''} 'wasm-unsafe-eval' https://cdn.jsdelivr.net; connect-src ${language === 'lua' ? "'none'" : 'https://cdn.jsdelivr.net'}; style-src 'unsafe-inline'; img-src data:; font-src data:; worker-src blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'`;
      let bootstrap = '';
      if (language === 'python') {
        const pythonPrelude = 'import builtins as _dw_builtins, json as _dw_json\n_dw_values=iter(_dw_json.loads('+JSON.stringify(JSON.stringify(stdin))+').splitlines())\ndef _dw_input(prompt=""):\n    if prompt: print(prompt, end="")\n    return next(_dw_values, "")\n_dw_builtins.input=_dw_input\n';
        bootstrap = `
        const script=document.createElement('script');script.crossOrigin='anonymous';script.src=${safeJSON(deps.python)};
        script.onerror=()=>send('failed','Could not download the browser Python runtime. Check your connection or content blocker.');
        script.onload=async()=>{try{
          const py=await loadPyodide({indexURL:${safeJSON(deps.pythonBase)}});
          py.setStdout({batched:text=>send('output',text+'\\n')});
          py.setStderr({batched:text=>send('output',text+'\\n')});
          await py.runPythonAsync(${safeJSON(pythonPrelude)}+${safeJSON(source)});send('done');
        }catch(error){send('failed',error?.message||String(error));}};
        document.head.append(script);`;
      }
      if (language === 'lua') bootstrap = `
        const script=document.createElement('script');script.crossOrigin='anonymous';script.src=${safeJSON(deps.lua)};
        script.onerror=()=>send('failed','Could not download the browser Lua runtime. Check your connection or content blocker.');
        script.onload=()=>{try{const original=console.log;console.log=(...items)=>send('output',items.map(String).join(' ')+'\\n');console.error=(...items)=>send('output','[error] '+items.map(String).join(' ')+'\\n');fengari.load(${safeJSON(source)},'=darkwave.lua')();send('done')}catch(error){send('failed',error?.stack||String(error))}};
        document.head.append(script);`;
      if (language === 'sql') {
        const sqlSeed = "CREATE TABLE locations (name TEXT, district TEXT, visitors INTEGER); INSERT INTO locations VALUES ('The Old Harbor','Harbor',18),('Vesper House','Hill',4),('The Amusement Pier','Coast',31),('Widow’s Rise','Hill',7);";
        bootstrap = `
        const script=document.createElement('script');script.crossOrigin='anonymous';script.src=${safeJSON(deps.sql)};
        script.onerror=()=>send('failed','Could not download the browser SQLite runtime. Check your connection or content blocker.');
        script.onload=async()=>{try{const SQL=await initSqlJs({locateFile:file=>${safeJSON(deps.sqlBase)}+file});const db=new SQL.Database();
          db.run(${safeJSON(sqlSeed)});
          const results=db.exec(${safeJSON(source)});
          if(!results.length)send('output','Query completed. No rows returned.\\n');
          for(const result of results){send('output',result.columns.join(' | ')+'\\n');for(const row of result.values)send('output',row.map(value=>value===null?'NULL':String(value)).join(' | ')+'\\n')}
          db.close();send('done');
        }catch(error){send('failed',error?.message||String(error));}};
        document.head.append(script);`;
      }
      frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><script>const data=${payload};const send=(type,text='')=>parent.postMessage({token:data.token,type,text},'*');window.onerror=(message,source,line,column,error)=>send('failed',(error&&error.stack)||(error&&error.message)||String(message)+' ('+(source||'sandbox')+':'+(line||0)+':'+(column||0)+')');</script></head><body><script>${bootstrap}<\x2fscript></body></html>`;
      document.body.append(frame);
    });
  }

  window.darkwaveRunLocalRuntime = (language, source, stdin, onOutput) => {
    if (!['python', 'lua', 'sql'].includes(language)) return Promise.reject(new Error('This local runtime is not available.'));
    return runInFrame(language, source, stdin || '', onOutput);
  };
  window.darkwaveLocalRuntimeIds = ['javascript', 'htmlcss', 'python', 'lua', 'sql'];
})();
