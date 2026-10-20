(() => {
  const escape = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const keywords = new Set('abstract as async await break case catch class const continue def default do else enum export extends false final finally fn for foreach from fun function if implements import in interface let match module new null of package private protected public return static struct super switch this throw trait true try type typeof use var void while with yield async await fn impl pub mut self println print console log main SELECT select FROM from WHERE where where AND OR NOT AS INSERT INTO VALUES UPDATE DELETE CREATE TABLE JOIN ON GROUP BY ORDER LIMIT DISTINCT COUNT SUM if elif fi then function local end echo printf read set unset package func defer go chan map range select type interface struct return nil true false def lambda lambda import class pass global nonlocal try except finally with yield raise and or not is in print puts require using namespace static null None none self end namespace using public protected private internal get set new ref out foreach switch when val var data object companion override open fun package endmodule module exposing let in case of if then else return'.split(/\s+/));
  const constants = new Set(['NULL','TRUE','FALSE','None','Some','Ok','Err','undefined','NaN','Infinity']);
  function highlight(source, language='javascript') {
    const comments=['\\/\\*[\\s\\S]*?\\*\\/','\\/\\/[^\\n]*','<!--[\\s\\S]*?-->'];
    if(['sql','haskell','elm','purescript','lua'].includes(language))comments.push('--[^\\n]*');
    if(language==='r')comments.push('%%[^\\n]*');
    if(['haskell','elm','purescript'].includes(language))comments.push('\\{-[\\s\\S]*?-\\}');
    if(['python','ruby','r','julia','perl','crystal','elixir','powershell','bash'].includes(language))comments.push('^[ \\t]*#(?:[ \\t]|!)[^\\n]*');
    const tokenPattern=new RegExp(`(?:${comments.join('|')})|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|`+'`(?:\\\\.|[^`\\\\])*`'+`|<\\/?[A-Za-z][\\w:-]*|\\/?>(?=\\s|$)|\\b\\d+(?:\\.\\d+)?\\b|\\b[A-Za-z_$][\\w$]*\\b|[{}()[\\].,;:+\\-*\\/%=<>!&|^~?:#@]+`,'gm');
    let html='', cursor=0, match;
    while((match=tokenPattern.exec(source))){
      html+=escape(source.slice(cursor,match.index));
      const token=match[0];let kind='';
      if(/^(?:\/\/|\/\*|<!--)/.test(token)||(token.startsWith('--')&&['sql','haskell','elm','purescript','lua'].includes(language))||(token.startsWith('%%')&&language==='r')||(token.startsWith('{-')&&['haskell','elm','purescript'].includes(language))||(token.startsWith('#')&&['python','ruby','r','julia','perl','crystal','elixir','powershell','bash'].includes(language)&&/^#[ \\t!]/.test(token)))kind='comment';
      else if(/^["'`]/.test(token))kind='string';
      else if(/^\d/.test(token))kind='number';
      else if(token.startsWith('<')&&/[A-Za-z]/.test(token[1]||''))kind='tag';
      else if(/^[A-Za-z_$]/.test(token)){if(constants.has(token))kind='constant';else if(/^\s*\(/.test(source.slice(tokenPattern.lastIndex)))kind='function';else if(keywords.has(token))kind='keyword'}
      else if(/^[{}()[\].,;:+\-*\/%=<>!&|^~?:#@]+$/.test(token))kind='operator';
      html+=kind?`<span class="syn-${kind}">${escape(token)}</span>`:escape(token);cursor=tokenPattern.lastIndex;
    }
    html+=escape(source.slice(cursor));return html+'\n';
  }
  window.darkwaveHighlight=highlight;
  const editor=document.querySelector('#codeEditor'),layer=document.querySelector('#syntaxLayer'),select=document.querySelector('#languageSelect');
  if(!editor||!layer)return;
  function paint(){layer.innerHTML=highlight(editor.value,select?.value||'javascript')}
  function sync(){layer.style.transform=`translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`}
  editor.addEventListener('input',paint);editor.addEventListener('scroll',sync,{passive:true});select?.addEventListener('change',paint);
  window.darkwavePaintSyntax=paint;window.darkwaveHighlight=highlight;paint();sync();
})();
