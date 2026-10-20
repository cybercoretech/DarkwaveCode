const $=selector=>document.querySelector(selector);
const labelFor={help:'HELP DESK',courses:'COURSES',workbench:'WORKBENCH',showcase:'SHOWCASE',general:'GENERAL'};
let threads=[],currentUser=null,filter='all';
async function api(path,options={}){const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let data={};try{data=await response.json()}catch{}if(!response.ok)throw Error(data.error||`Request failed (${response.status}).`);return data}
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function formatDate(value){return new Date(value*1000).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function button(text,className,attrs={}){const node=el('button',className,text);node.type='button';for(const[key,value]of Object.entries(attrs))node.dataset[key]=value;return node}
function buildReply(reply){
  const card=el('article','reply-card'),head=el('div','reply-head'),author=el('b','',`@${reply.handle}`),date=el('time','',formatDate(reply.created_at));head.append(author,date);const body=el('p','reply-body',reply.body);card.append(head,body);
  const actions=el('div','post-actions');if(currentUser){actions.append(button('REPORT','text-action',{reportReply:reply.id}))}if(currentUser?.isAdmin)actions.append(button('HIDE REPLY','text-action moderator-action',{'modTarget':reply.id,'modType':'reply','modAction':'hide_reply'}));if(actions.childNodes.length)card.append(actions);return card;
}
async function report(target){const reason=prompt('What should a moderator know about this post?');if(!reason)return;try{const result=await api('/api/community/report',{method:'POST',body:JSON.stringify({...target,reason})});alert(result.message||'Report sent.');}catch(error){alert(error.message)}}
async function openReplies(thread,holder){
  holder.replaceChildren(el('p','community-loading','LOADING REPLIES…'));
  try{
    const data=await api(`/api/community/replies?thread=${encodeURIComponent(thread.id)}`);holder.replaceChildren();
    for(const reply of data.replies)holder.append(buildReply(reply));
    if(!data.replies.length)holder.append(el('p','empty-replies','No replies yet. Start the conversation.'));
    if(currentUser&&!thread.is_locked){
      const form=el('form','reply-form'),textarea=document.createElement('textarea');textarea.name='body';textarea.maxLength=2000;textarea.minLength=2;textarea.required=true;textarea.rows=3;textarea.placeholder='Add a thoughtful reply…';
      const submit=document.createElement('button');submit.className='button primary';submit.textContent='SEND REPLY ↗';form.append(textarea,submit);form.addEventListener('submit',async event=>{event.preventDefault();submit.disabled=true;try{await api('/api/community/reply',{method:'POST',body:JSON.stringify({threadId:thread.id,body:textarea.value})});threads=await loadThreads(false);renderThreads();const refreshed=threads.find(item=>item.id===thread.id);const newCard=[...document.querySelectorAll('.thread-card')].find(node=>node.dataset.threadId===thread.id);const panel=newCard?.querySelector('.reply-panel');if(refreshed&&panel){panel.hidden=false;panel.dataset.loaded='true';await openReplies(refreshed,panel)}}catch(error){alert(error.message)}finally{submit.disabled=false}});holder.append(form)
    }else if(thread.is_locked)holder.append(el('p','locked-note','MODERATOR LOCK / REPLIES ARE CLOSED'));
  }catch(error){holder.replaceChildren(el('p','empty-replies',error.message))}
}
function threadCard(thread){
  const card=el('article','thread-card');card.dataset.threadId=thread.id;const header=el('div','thread-head'),cat=el('span',`category-tag category-${thread.category}`,labelFor[thread.category]||'GENERAL'),date=el('time','',`UPDATED ${formatDate(thread.updated_at)}`);header.append(cat,date);
  const title=el('h2','thread-title',thread.title),copy=el('p','thread-body',thread.body),byline=el('div','thread-byline');byline.append(el('span','',`STARTED BY @${thread.handle}`),el('span','','·'),el('span','',`${thread.reply_count} REPLIES`));
  const actions=el('div','thread-actions'),replyButton=button(thread.is_locked?'READ THREAD / LOCKED':`OPEN REPLIES / ${thread.reply_count}`,'reply-toggle');actions.append(replyButton);
  if(currentUser)actions.append(button('REPORT','text-action',{reportThread:thread.id}));
  if(currentUser?.isAdmin){actions.append(button(thread.is_locked?'UNLOCK':'LOCK','text-action moderator-action',{'modTarget':thread.id,'modType':'thread','modAction':thread.is_locked?'unlock_thread':'lock_thread'}),button('HIDE','text-action moderator-action',{'modTarget':thread.id,'modType':'thread','modAction':'hide_thread'}))}
  const panel=el('div','reply-panel');panel.hidden=true;replyButton.addEventListener('click',async()=>{panel.hidden=!panel.hidden;if(!panel.dataset.loaded){panel.dataset.loaded='true';await openReplies(thread,panel)}});
  card.append(header,title,copy,byline,actions,panel);return card;
}
function renderThreads(){
  const sort=$('#threadSort').value;let visible=threads.filter(thread=>filter==='all'||thread.category===filter);
  if(sort==='new')visible=[...visible].sort((a,b)=>b.created_at-a.created_at);else if(sort==='replies')visible=[...visible].sort((a,b)=>b.reply_count-a.reply_count);else visible=[...visible].sort((a,b)=>b.updated_at-a.updated_at);
  const feed=$('#threadFeed');feed.replaceChildren();if(!visible.length){feed.append(el('p','empty-replies','NO SIGNALS IN THIS CHANNEL YET. Start the first discussion.'));return}for(const thread of visible)feed.append(threadCard(thread));
}
async function loadThreads(update=true){const data=await api('/api/community');currentUser=data.user;if(currentUser){$('#threadForm').hidden=false;$('#communitySignIn').hidden=true;$('#composePrompt').textContent=`Posting as @${currentUser.handle}. Keep it useful, clear, and kind.`;$('.community-meta span').textContent=`SIGNED IN / @${currentUser.handle}`}threads=data.threads||[];if(update)renderThreads();return threads}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('selected',item===button));renderThreads()}));
$('#threadSort').addEventListener('change',renderThreads);
$('#threadFeed').addEventListener('click',event=>{const reportThread=event.target.closest('[data-report-thread]'),reportReply=event.target.closest('[data-report-reply]'),moderate=event.target.closest('[data-mod-action]');if(reportThread)report({threadId:reportThread.dataset.reportThread});else if(reportReply)report({replyId:reportReply.dataset.reportReply});else if(moderate){api('/api/admin/community/moderate',{method:'POST',body:JSON.stringify({targetId:moderate.dataset.modTarget,targetType:moderate.dataset.modType,action:moderate.dataset.modAction})}).then(()=>loadThreads()).catch(error=>alert(error.message))}});
$('#threadForm').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type=submit]');button.disabled=true;$('#composeFeedback').textContent='TRANSMITTING…';try{await api('/api/community/thread',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});form.reset();$('#composeFeedback').textContent='TOPIC POSTED';filter='all';document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('selected',item.dataset.filter==='all'));await loadThreads()}catch(error){$('#composeFeedback').textContent=error.message}finally{button.disabled=false}});
loadThreads().catch(error=>{$('#threadFeed').replaceChildren(el('p','empty-replies',`CHANNEL UNAVAILABLE / ${error.message}`));$('#composePrompt').textContent='The community service could not connect. Please refresh in a moment.';$('.community-meta span').textContent='CHANNEL STATUS / SERVICE UNAVAILABLE';$('.community-meta i').classList.add('offline-signal')});
