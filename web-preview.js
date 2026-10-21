(() => {
  const MAX_OUTPUT = 12000;
  const closeScript = '</' + 'script>';
  const safeTagBody = (value, tag) => String(value).replace(new RegExp('</' + tag, 'gi'), '<\\/' + tag);

  window.darkwavePreviewWeb = ({html, css = '', js = '', frame, onOutput}) => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let outputSize = 0;
    const receive = event => {
      if (event.source !== frame.contentWindow || event.data?.token !== token || event.data.type !== 'output') return;
      const remaining = MAX_OUTPUT - outputSize;
      if (remaining <= 0) return;
      const text = String(event.data.text || '').slice(0, remaining);
      outputSize += text.length;
      onOutput(text);
    };
    window.addEventListener('message', receive);
    const bridge = `<script>(function(){const token=${JSON.stringify(token)};const send=text=>parent.postMessage({token,type:'output',text:String(text)},'*');const stringify=v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}};console.log=(...v)=>send(v.map(stringify).join(' ')+'\\n');console.info=console.log;console.warn=(...v)=>send('[warn] '+v.map(stringify).join(' ')+'\\n');console.error=(...v)=>send('[error] '+v.map(stringify).join(' ')+'\\n');window.onerror=(m,s,l,c,e)=>send('[error] '+(e&&e.stack||m)+'\\n');window.onunhandledrejection=e=>send('[error] '+String(e.reason)+'\\n')})();${closeScript}`;
    const style = `<style>${safeTagBody(css, 'style')}</style>`;
    const script = `<script>${safeTagBody(js, 'script')}${closeScript}`;
    const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'">`;
    let documentSource = String(html || '');
    if (/<html[\s>]/i.test(documentSource)) {
      documentSource = documentSource.replace(/<head([^>]*)>/i, `<head$1>${policy}${bridge}${style}`);
      if (!/<head[\s>]/i.test(html)) documentSource = documentSource.replace(/<html([^>]*)>/i, `<html$1><head>${policy}${bridge}${style}</head>`);
      if (/<\/body>/i.test(documentSource)) documentSource = documentSource.replace(/<\/body>/i, `${script}</body>`);
      else documentSource += script;
    } else {
      documentSource = `<!doctype html><html><head><meta charset="utf-8">${policy}${bridge}${style}</head><body>${documentSource}${script}</body></html>`;
    }
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.srcdoc = documentSource;
    return () => window.removeEventListener('message', receive);
  };
})();
