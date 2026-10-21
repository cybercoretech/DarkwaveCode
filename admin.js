const $ = selector => document.querySelector(selector);
const languageNames = {
  c:'C',cpp:'C++',python:'Python 3',javascript:'JavaScript',rust:'Rust',go:'Go',java:'Java',typescript:'TypeScript',sql:'SQL',bash:'Bash / Shell',csharp:'C#',powershell:'PowerShell',php:'PHP',kotlin:'Kotlin',lua:'Lua',assembly:'Assembly Language',swift:'Swift',ruby:'Ruby',dart:'Dart',r:'R',htmlcss:'HTML + CSS',zig:'Zig',scala:'Scala',julia:'Julia',perl:'Perl',haskell:'Haskell',clojure:'Clojure',crystal:'Crystal',elixir:'Elixir',elm:'Elm',erlang:'Erlang',groovy:'Groovy',purescript:'PureScript',vex:'Vex · template only'
};
const courseNames = {javascript:'JavaScript',python:'Python','htmlcss':'HTML + CSS',sql:'SQL',bash:'Bash / Shell',vex:'Vex Language Lab'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let state = null, range = 30;

async function api(path, options={}) {
  const response = await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw Error(data.error||`Request failed (${response.status}).`);
  return data;
}
function settingCheckboxes(target, items, selected) {
  const parent=$(target);parent.replaceChildren();
  for(const [id,label] of Object.entries(items)){
    const wrapper=document.createElement('label');wrapper.className='admin-toggle';
    const input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=selected.includes(id);input.dataset.setting=id;
    const copy=document.createElement('span');copy.textContent=label;wrapper.append(input,copy);parent.append(wrapper);
  }
}
function activeBan(user){return Boolean(user.is_banned)&&(user.banned_until===null||user.banned_until>Math.floor(Date.now()/1000))}
function renderMembers(users){
  const body=$('#memberRows'),select=$('#banUser');body.replaceChildren();select.replaceChildren(new Option('Select a member',''));
  for(const user of users){
    const isActive=activeBan(user),row=document.createElement('tr');
    const handle=document.createElement('td');handle.textContent=`@${user.handle}`;
    const language=document.createElement('td');language.textContent=user.favorite_language||'—';
    const status=document.createElement('td');status.textContent=isActive?(user.banned_until===null?'SUSPENDED · PERMANENT':`SUSPENDED · ${new Date(user.banned_until*1000).toLocaleDateString()}`):'ACTIVE';status.className=isActive?'member-banned':'member-active';
    const action=document.createElement('td');
    if(isActive){const button=document.createElement('button');button.type='button';button.className='table-action';button.dataset.unban=user.id;button.textContent='RESTORE';action.append(button)}else{action.textContent='—';if(user.id){select.add(new Option(`@${user.handle} · ${user.favorite_language||'CODE'}`,user.id))}}
    row.append(handle,language,status,action);body.append(row);
  }
}
function renderTelemetry(){
  const rows=state.events.filter(row=>row.day>=new Date(Date.now()-range*86400000).toISOString().slice(0,10));
  const languages=new Map(),pages=new Map();let total=0,success=0,duration=0;
  for(const row of rows){const count=Number(row.event_count)||0;if(row.event==='run'){total+=count;success+=Number(row.success_count)||0;duration+=Number(row.duration_total)||0;const old=languages.get(row.label)||{count:0,success:0,duration:0};old.count+=count;old.success+=Number(row.success_count)||0;old.duration+=Number(row.duration_total)||0;languages.set(row.label,old)}else if(row.event==='page'){pages.set(row.label,(pages.get(row.label)||0)+count)}}
  const max=Math.max(1,...[...languages.values()].map(item=>item.count));const sorted=[...languages.entries()].sort((a,b)=>b[1].count-a[1].count);
  $('#languageStats').innerHTML=`<div class="telemetry-summary"><div><b>${total.toLocaleString()}</b><span>CODE RUNS</span></div><div><b>${total?Math.round(success/total*100):0}%</b><span>SUCCESS RATE</span></div><div><b>${total?Math.round(duration/total):0} ms</b><span>AVG EXECUTION</span></div><div><b>${rows.filter(row=>row.event==='course_complete').reduce((sum,row)=>sum+Number(row.event_count),0).toLocaleString()}</b><span>LESSONS COMPLETED</span></div></div><div class="stats-heading">LANGUAGE DEMAND <span>${range}D WINDOW · ${languages.size} LANGUAGES</span></div>${sorted.length?sorted.map(([id,item])=>`<div class="language-stat"><span>${esc(languageNames[id]||id)}</span><div class="stat-track"><i style="width:${Math.max(2,item.count/max*100)}%"></i></div><b>${item.count.toLocaleString()}</b><small>${item.count?Math.round(item.success/item.count*100):0}% OK</small></div>`).join(''):'<p class="empty-state">No code-run signals collected yet.</p>'}`;
  const pageTotal=[...pages.values()].reduce((sum,value)=>sum+value,0);
  $('#pageStats').innerHTML=`<div class="stats-heading">PAGE TRAFFIC <span>${pageTotal.toLocaleString()} AGGREGATE VIEWS</span></div><div class="page-stat-grid">${[...pages.entries()].sort((a,b)=>b[1]-a[1]).map(([id,count])=>`<div><span>${esc(id.toUpperCase())}</span><b>${count.toLocaleString()}</b><i style="--share:${pageTotal?count/pageTotal*100:0}%"></i></div>`).join('')||'<p class="empty-state">Page view aggregates will appear here.</p>'}</div>`;
}
function renderAudit(rows){$('#auditLog').innerHTML=rows.length?rows.map(row=>{let details={};try{details=JSON.parse(row.details||'{}')}catch{};return `<article><span>${new Date(row.created_at*1000).toLocaleString()}</span><b>${esc(row.action.replaceAll('_',' ').toUpperCase())}</b><small>${esc(row.handle)} · ${esc(row.target_type)} ${esc(row.target_id)}</small><i>${esc(details.reason||details.visibleCourses!==undefined?details.reason||`${details.visibleCourses} tracks / ${details.visibleLanguages} languages`:'')}</i></article>`}).join(''):'<p class="empty-state">No administrative changes recorded yet.</p>'}
function renderModeration(reports,hidden){
  $('#reportCount').textContent=`${reports.length} OPEN`;
  $('#discussionReports').innerHTML=reports.length?reports.map(report=>{const isReply=Boolean(report.reply_id),targetId=isReply?report.reply_id:report.thread_id,targetType=isReply?'reply':'thread';return `<article class="report-card"><div class="report-top"><b>${esc(report.subject)}</b><span>${new Date(report.created_at*1000).toLocaleString()}</span></div><p>${esc(report.excerpt)}</p><small>REPORTED BY @${esc(report.reporter)} · ${esc(report.reason)}</small><div class="report-actions"><button data-report="${esc(report.id)}" data-action="${isReply?'hide_reply':'hide_thread'}">HIDE ${targetType.toUpperCase()}</button><button data-report="${esc(report.id)}" data-action="lock_thread">LOCK THREAD</button><button data-report="${esc(report.id)}" data-action="resolve_report">RESOLVE</button></div></article>`}).join(''):'<p class="empty-state">No open discussion reports.</p>';
  $('#hiddenCount').textContent=`${hidden.length} ITEMS`;
  $('#hiddenContent').innerHTML=hidden.length?hidden.map(item=>`<article class="report-card hidden-card"><div class="report-top"><b>${esc(item.label)}</b><span>${new Date(item.created_at*1000).toLocaleString()}</span></div><small>HIDDEN ${esc(item.target_type.toUpperCase())}</small><div class="report-actions"><button data-target="${esc(item.target_id)}" data-target-type="${esc(item.target_type)}" data-action="restore_${esc(item.target_type)}">RESTORE CONTENT</button>${item.target_type==='thread'?`<button data-target="${esc(item.target_id)}" data-target-type="thread" data-action="unlock_thread">UNLOCK THREAD</button>`:''}</div></article>`).join(''):'<p class="empty-state">No content is currently hidden.</p>';
}
function renderHealth(health){
  const services=[['Account database',health.accountDatabase],['Google sign-in',health.googleOAuth],['Email delivery',health.emailDelivery],['Compiler runner',Boolean(window.DARKWAVE_RUNNER?.url)]];
  $('#healthChecks').innerHTML=services.map(([name,ok])=>`<div><span class="health-dot ${ok?'online':'offline'}"></span><b>${esc(name)}</b><strong>${ok?'READY':'NOT CONFIGURED'}</strong></div>`).join('')+`<p class="health-stamp">CHECKED ${new Date(health.generatedAt*1000).toLocaleString()}</p>`;
}
function render(data){
  state=data;
  const metrics=[['MEMBER ACCOUNTS',data.totals.users],['NEW / LAST 7 DAYS',data.totals.newUsers7d],['ACTIVE SUSPENSIONS',data.activeBans],['PAGE VIEWS / 30 DAYS',data.events.filter(row=>row.event==='page').reduce((sum,row)=>sum+Number(row.event_count),0)]];
  $('#adminMetrics').innerHTML=metrics.map(([label,value])=>`<article><span>${esc(label)}</span><b>${Number(value).toLocaleString()}</b></article>`).join('');
  $('#announcementEnabled').checked=data.settings.announcement.enabled;$('#announcementText').value=data.settings.announcement.text;$('#announcementLink').value=data.settings.announcement.link;$('#announcementLinkLabel').value=data.settings.announcement.linkLabel;
  settingCheckboxes('#courseControls',courseNames,data.settings.visibleCourses);settingCheckboxes('#languageControls',languageNames,data.settings.visibleLanguages);
  renderMembers(data.users);renderTelemetry();renderAudit(data.audit);renderHealth(data.health);renderModeration(data.reports||[],data.hiddenContent||[]);
}
async function refresh(){try{const data=await api('/api/admin/overview');render(data);$('#adminStatus').textContent='ADMIN SESSION / VERIFIED';$('#adminStatus').classList.add('is-ready');$('#adminContent').hidden=false;$('#adminDenied').hidden=true}catch(error){$('#adminStatus').textContent=error.message;$('#adminDenied').hidden=false}}
function selectedValues(selector){return [...document.querySelectorAll(`${selector} input:checked`)].map(input=>input.value)}
$('#saveSettings').addEventListener('click',async()=>{
  const button=$('#saveSettings');button.disabled=true;$('#saveFeedback').textContent='WRITING SETTINGS…';
  try{const data=await api('/api/admin/settings',{method:'PUT',body:JSON.stringify({announcement:{enabled:$('#announcementEnabled').checked,text:$('#announcementText').value,link:$('#announcementLink').value,linkLabel:$('#announcementLinkLabel').value},visibleCourses:selectedValues('#courseControls'),visibleLanguages:selectedValues('#languageControls')})});state.settings=data.settings;$('#saveFeedback').textContent='SETTINGS SAVED · LIVE ON SITE'}catch(error){$('#saveFeedback').textContent=error.message}finally{button.disabled=false}
});
$('#banForm').addEventListener('submit',async event=>{
  event.preventDefault();const userId=$('#banUser').value;if(!userId)return;
  try{await api('/api/admin/users/ban',{method:'POST',body:JSON.stringify({userId,duration:$('#banDuration').value,reason:$('#banReason').value})});$('#saveFeedback').textContent='MEMBER SUSPENDED · ACTIVE SESSIONS REVOKED';$('#banReason').value='';await refresh()}catch(error){$('#saveFeedback').textContent=error.message}
});
$('#memberRows').addEventListener('click',async event=>{const button=event.target.closest('[data-unban]');if(!button)return;button.disabled=true;try{await api('/api/admin/users/unban',{method:'POST',body:JSON.stringify({userId:button.dataset.unban})});$('#saveFeedback').textContent='MEMBER RESTORED';await refresh()}catch(error){button.disabled=false;$('#saveFeedback').textContent=error.message}});
async function moderate(button){button.disabled=true;try{await api('/api/admin/community/moderate',{method:'POST',body:JSON.stringify({reportId:button.dataset.report,targetId:button.dataset.target,targetType:button.dataset.targetType,action:button.dataset.action})});$('#saveFeedback').textContent=`MODERATION ACTION / ${button.dataset.action.replaceAll('_',' ').toUpperCase()}`;await refresh()}catch(error){button.disabled=false;$('#saveFeedback').textContent=error.message}}
$('#discussionReports').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)moderate(button)});
$('#hiddenContent').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)moderate(button)});
document.querySelectorAll('[data-range]').forEach(button=>button.addEventListener('click',()=>{range=Number(button.dataset.range);document.querySelectorAll('[data-range]').forEach(item=>item.classList.toggle('selected',item===button));renderTelemetry()}));
refresh();
