(() => {
  const MAX_OUTPUT = 12000;
  const TIME_LIMIT = 1800;

  window.darkwaveRunJavaScript = (source, onOutput) => new Promise((resolve, reject) => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const frame = document.createElement('iframe');
    frame.title = 'Isolated JavaScript execution sandbox';
    frame.setAttribute('sandbox', 'allow-scripts');
    Object.assign(frame.style, { position: 'fixed', left: '-10px', bottom: '0', width: '1px', height: '1px', opacity: '0', border: '0', pointerEvents: 'none' });

    let finished = false;
    let outputLength = 0;
    const finish = error => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      frame.remove();
      error ? reject(error) : resolve();
    };
    const receive = event => {
      if (event.source !== frame.contentWindow || event.data?.token !== token || finished) return;
      if (event.data.type === 'log' || event.data.type === 'error') {
        const remaining = MAX_OUTPUT - outputLength;
        if (remaining > 0) {
          const text = String(event.data.text).slice(0, remaining);
          outputLength += text.length;
          onOutput(text);
        }
        if (outputLength >= MAX_OUTPUT) finish(new Error('Output limit reached (12 KB).'));
      }
      if (event.data.type === 'done') finish();
      if (event.data.type === 'failed') finish(new Error(String(event.data.text).slice(0, 3000)));
    };
    const timer = setTimeout(() => finish(new Error('Execution stopped after 1.8 seconds. Check for an infinite loop.')), TIME_LIMIT);
    window.addEventListener('message', receive);

    const payload = JSON.stringify({ source, token }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src 'none'; style-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'"><script>
      const payload = ${payload};
      const workerSource = ` + '`' + `
        const format = value => { try { return typeof value === 'string' ? value : JSON.stringify(value); } catch { return String(value); } };
        const send = (type, text = '') => postMessage({ type, text });
        console.log = (...values) => send('log', values.map(format).join(' ') + '\\\\n');
        console.info = console.log;
        console.warn = (...values) => send('log', '[warn] ' + values.map(format).join(' ') + '\\\\n');
        console.error = (...values) => send('log', '[error] ' + values.map(format).join(' ') + '\\\\n');
        onmessage = async event => {
          try {
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
            await new AsyncFunction(event.data)();
            send('done');
          } catch (error) { send('failed', error && error.stack ? error.stack : String(error)); }
        };
      ` + '`' + `;
      const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      const worker = new Worker(workerUrl);
      URL.revokeObjectURL(workerUrl);
      worker.onmessage = event => {
        parent.postMessage({ token: payload.token, type: event.data.type, text: event.data.text }, '*');
        if (event.data.type === 'done' || event.data.type === 'failed') worker.terminate();
      };
      worker.onerror = event => parent.postMessage({ token: payload.token, type: 'failed', text: (event.message || 'Worker failed.')+' ('+(event.filename || 'worker')+':'+(event.lineno || 0)+':'+(event.colno || 0)+')' }, '*');
      worker.postMessage(payload.source);
    <${'/'}script>`;
    document.body.append(frame);
  });
})();
