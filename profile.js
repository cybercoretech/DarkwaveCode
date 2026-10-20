const $=(selector,root=document)=>root.querySelector(selector);
const form=$('#profileForm'),authForm=$('#emailForm'),status=$('#accountStatus'),feedback=$('#profileFeedback');
const avatarChoices=new Map([...document.querySelectorAll('[data-avatar-kind="art"]')].map(button=>[button.dataset.avatarValue,button.querySelector('img').src]));
const profileDefaults={handle:'',displayName:'',bio:'',favoriteLanguage:'JavaScript',experienceLevel:'curious',avatarKind:'emoji',avatarValue:'👾',avatarImage:'',theme:'cyberpunk/cyberpunk-neon',profileVisibility:'public',showActivity:true,emailProductUpdates:false};
let mode='login',account=null,avatar={kind:'emoji',value:'👾',image:''},currentTheme='cyberpunk/cyberpunk-neon',themeManifest;

async function api(path,options={}){
  const response=await fetch(`/api/${path}`,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.error||`Account request failed (${response.status}).`);
  return data;
}
function setMessage(message){$('#authMessage').textContent=message||''}
function setFeedback(message){feedback.textContent=message||''}
function applyAvatar(target,choice){
  target.replaceChildren();target.classList.toggle('avatar-emoji',choice.kind==='emoji');
  if(choice.kind==='emoji'){target.textContent=choice.value;return}
  const image=document.createElement('img');image.alt='';image.src=choice.kind==='image'?choice.image:avatarChoices.get(choice.value)||'';target.append(image);
}
function selectedAvatar(kind,value,image=''){
  avatar={kind,value,image};applyAvatar($('#avatarPreview'),avatar);
  document.querySelectorAll('.avatar-option').forEach(button=>button.setAttribute('aria-pressed',String(kind==='art'&&button.dataset.avatarValue===value)));
  document.querySelectorAll('.emoji-picker button').forEach(button=>button.setAttribute('aria-pressed',String(kind==='emoji'&&button.dataset.avatarValue===value)));
  const local=collectProfile();saveDraft({...local,avatarKind:kind,avatarValue:value,avatarImage:image});
}
function collectProfile(){
 const data=Object.fromEntries(new FormData(form));
 return {...profileDefaults,...data,avatarKind:avatar.kind,avatarValue:avatar.value,avatarImage:avatar.kind==='image'?avatar.image:'',showActivity:form.elements.showActivity.checked,emailProductUpdates:form.elements.emailProductUpdates.checked};
}
function saveDraft(data=collectProfile()){
 try{localStorage.setItem('darkwave-profile-draft',JSON.stringify(data))}catch{setFeedback('Local storage is unavailable in this browser. Sign in to sync changes.')}
}
async function applyTheme(value){
 if(!value||!/^[-a-z0-9]+\/[-a-z0-9]+$/.test(value))return;
 try{const [family,name]=value.split('/'),response=await fetch(`data/themes/${family}/${name}.json`);if(!response.ok)return;const palette=await response.json(),tokens={bg:'--bg',white:'--white',acid_green:'--acid',hot_pink:'--pink',purple:'--purple',cyan:'--cyan',orange:'--orange',panel:'--panel',line:'--line',muted:'--muted'};for(const[key,token]of Object.entries(tokens))if(palette[key])document.documentElement.style.setProperty(token,`#${palette[key]}`);const meta=$('meta[name="theme-color"]');if(meta&&palette.bg)meta.content=`#${palette.bg}`;currentTheme=value;$('#profileTheme').value=value;const main=$('#themeSelect');if(main)main.value=value;try{localStorage.setItem('cybercore-theme',value)}catch{}}
 catch(error){console.warn('Could not apply Cybercore theme',error)}
}
function hydrate(data){
 const merged={...profileDefaults,...data};
 for(const name of ['handle','displayName','bio','favoriteLanguage','experienceLevel','theme','profileVisibility'])if(form.elements[name])form.elements[name].value=merged[name]||profileDefaults[name];
 form.elements.showActivity.checked=!!merged.showActivity;form.elements.emailProductUpdates.checked=!!merged.emailProductUpdates;
 avatar={kind:merged.avatarKind||'emoji',value:merged.avatarValue||'👾',image:merged.avatarImage||''};
 if(avatar.kind==='art'&&!avatarChoices.has(avatar.value))avatar={kind:'emoji',value:'👾',image:''};
 if(avatar.kind==='image'&&!avatar.image)avatar={kind:'emoji',value:'👾',image:''};
 applyAvatar($('#avatarPreview'),avatar);markAvatar();updatePreview();
}
function markAvatar(){document.querySelectorAll('.avatar-option').forEach(button=>button.setAttribute('aria-pressed',String(avatar.kind==='art'&&button.dataset.avatarValue===avatar.value)));document.querySelectorAll('.emoji-picker button').forEach(button=>button.setAttribute('aria-pressed',String(avatar.kind==='emoji'&&button.dataset.avatarValue===avatar.value)))}
function updatePreview(){const data=collectProfile();$('#previewName').textContent=data.displayName||'New Night Coder';$('#previewHandle').textContent='@'+(data.handle||'your_handle')}
function setAuthMode(next){mode=next;document.querySelectorAll('[data-auth-mode]').forEach(button=>{const active=button.dataset.authMode===mode;button.classList.toggle('selected',active);button.setAttribute('aria-selected',String(active))});document.querySelectorAll('.register-only').forEach(element=>{element.hidden=mode!=='register'});authForm.elements.handle.required=mode==='register';authForm.elements.password.autocomplete=mode==='register'?'new-password':'current-password';authForm.elements.password.value='';$('#emailSubmit').innerHTML=mode==='register'?'CREATE ACCOUNT <b>↗</b>':'SIGN IN <b>↗</b>';$('#resendVerification').hidden=mode==='register';setMessage('')}
async function loadThemes(){
 const select=$('#profileTheme');
 try{themeManifest=await(await fetch('data/cybergrid.json')).json();const familyOrder=['cyberpunk','neosynth','synthwave','dystopian','default','cyberdyne','omarchy-live','cybercore-tech'];for(const family of familyOrder){if(!themeManifest.families[family])continue;const group=document.createElement('optgroup');group.label=family.replaceAll('-',' ').toUpperCase();for(const name of themeManifest.families[family]){const option=document.createElement('option');option.value=`${family}/${name}`;option.textContent=name.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());group.append(option)}select.append(group)}
   const main=$('#themeSelect');if(main){main.replaceChildren(...[...select.querySelectorAll('optgroup')].map(group=>group.cloneNode(true)));let local='';try{local=localStorage.getItem('cybercore-theme')||''}catch{}main.value=[...main.options].some(option=>option.value===local)?local:'cyberpunk/cyberpunk-neon';currentTheme=main.value;select.value=currentTheme;main.addEventListener('change',()=>{select.value=main.value;applyTheme(main.value)});}
 }catch(error){console.warn('Cybercore theme list unavailable',error)}
}
function setReadonlyProfile(user){
 const area=$('#publicProfile');area.hidden=false;area.replaceChildren();const card=document.createElement('div');card.className='public-profile-card';
 const visual=document.createElement('div');visual.className='public-profile-avatar';applyAvatar(visual,{kind:user.avatarKind,value:user.avatarValue,image:user.avatarImage});
 const copy=document.createElement('div'),eyebrow=document.createElement('small'),name=document.createElement('h2'),handle=document.createElement('p'),bio=document.createElement('p'),tags=document.createElement('div');
 eyebrow.textContent=`DARKWAVECODE PROFILE · ${user.favoriteLanguage||'CODE'} · ${user.experienceLevel||'CURIOUS'}`;name.textContent=user.displayName;handle.textContent='@'+user.handle;bio.textContent=user.bio||'No bio signal has been transmitted yet.';tags.className='profile-tags';
 for(const text of [user.favoriteLanguage||'Learning',user.experienceLevel||'Curious']){const tag=document.createElement('span');tag.textContent=text.toUpperCase();tags.append(tag)}
 copy.append(eyebrow,name,handle,bio,tags);card.append(visual,copy);area.append(card);
}
function renderAccount(user){
 account=user;$('#authPanel').classList.toggle('is-signed-in',!!user);$('#logoutButton').hidden=!user;$('#googleLogin').hidden=false;$('#adminShortcut').hidden=!user?.isAdmin;$('#siteAdminBadge').hidden=!user?.isAdmin;
 if(user){const google=$('#googleLogin');if(user.googleLinked){google.textContent='GOOGLE ACCOUNT LINKED ✓';google.classList.add('is-disabled')}else{google.textContent='LINK YOUR GOOGLE ACCOUNT ↗';google.classList.remove('is-disabled');google.href='/api/auth/google?return='+encodeURIComponent('/profile.html')}}
 if(user){$('#authPanel').querySelector('.auth-divider').hidden=true;$('.auth-tabs').hidden=true;authForm.hidden=true;$('#resetForm').hidden=true;$('#googleStatus').hidden=false;$('#authPanel').querySelector('h2').textContent='SIGNED IN / READY';$('#authPanel').querySelector('h2').classList.add('signed-in-heading');$('#authPanel').querySelector('.eyebrow').textContent='SESSION / SECURE';$('#authMessage').textContent=`Signed in as ${user.email||user.handle}${user.emailVerified?' · verified':''}. Your email stays private.`;$('#profileSync').textContent='ACCOUNT SYNC ON';$('#profileSync').classList.add('synced');$('#saveProfile').textContent='SAVE PROFILE';$('#shareProfile').hidden=false;hydrate({...user,profileVisibility:user.profileVisibility||'public'});$('#profileForm').elements.handle.value=user.handle;$('#profileForm').elements.displayName.value=user.displayName;updatePreview();setFeedback(`Saved to your DarkwaveCode account. Signed in as @${user.handle}.`);}
 else{const resetMode=new URLSearchParams(location.search).has('reset');$('.auth-tabs').hidden=resetMode;authForm.hidden=resetMode;$('#resetForm').hidden=!resetMode;$('#authPanel').querySelector('.auth-divider').hidden=resetMode;$('#profileSync').textContent='LOCAL DRAFT';$('#profileSync').classList.remove('synced');$('#shareProfile').hidden=true;$('#authPanel').querySelector('h2').classList.remove('signed-in-heading');$('#authPanel').querySelector('h2').innerHTML='WELCOME, <span>BUILDER.</span>';$('#authPanel').querySelector('.eyebrow').textContent='AUTHENTICATE / JOIN THE GRID';}
}
async function uploadAvatar(file){
 if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setFeedback('Choose a PNG, JPEG, or WebP image.');return}
 if(file.size>12*1024*1024){setFeedback('Choose an image smaller than 12 MB.');$('#avatarUpload').value='';return}
 try{const image=await createImageBitmap(file),scale=Math.min(1,512/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const context=canvas.getContext('2d');context.drawImage(image,0,0,canvas.width,canvas.height);image.close?.();let quality=.86,result=canvas.toDataURL('image/webp',quality);while(result.length>400000&&quality>.42){quality-=.1;result=canvas.toDataURL('image/webp',quality)}if(result.length>420000)throw Error('That image is too detailed to compress below 300 KB. Try a smaller image.');selectedAvatar('image','uploaded',result);setFeedback('Custom profile picture ready. Save your profile to sync it.');}
 catch(error){setFeedback(error.message||'That image could not be loaded.');$('#avatarUpload').value=''}
}
async function init(){
 await loadThemes();status.textContent='ACCOUNT SERVICE / CHECKING CONNECTION';
 let draft={};try{draft=JSON.parse(localStorage.getItem('darkwave-profile-draft')||'{}')}catch{}
 hydrate(draft);if(draft.theme)applyTheme(draft.theme);for(const name of ['handle','displayName','bio','favoriteLanguage','experienceLevel','theme','profileVisibility'])form.elements[name]?.addEventListener('input',()=>{updatePreview();saveDraft()});form.addEventListener('change',()=>{saveDraft();if(form.elements.theme.value)applyTheme(form.elements.theme.value)});
 document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>setAuthMode(button.dataset.authMode)));
 document.addEventListener('click',event=>{const button=event.target.closest('[data-avatar-kind]');if(button)selectedAvatar(button.dataset.avatarKind,button.dataset.avatarValue)});
 $('#avatarUpload').addEventListener('change',event=>uploadAvatar(event.target.files?.[0]));
 const query=new URLSearchParams(location.search);if(query.has('reset')){$('#resetForm').hidden=false;authForm.hidden=true;$('.auth-tabs').hidden=true;$('#resetForm').elements.password.focus()}
 if(query.has('auth_error')){const messages={state:'Google sign-in could not verify this browser session. Try again.',expired:'This Google sign-in link expired. Please try again.',cancelled:'Google sign-in was cancelled.',google:'Google could not finish sign-in. Check the OAuth setup and try again.',verify:'That email verification link expired or was already used.',banned:'This account is suspended. Contact DarkwaveCode support if you believe this is a mistake.'};setMessage(messages[query.get('auth_error')]||'Sign-in did not finish. Please try again.')}
 if(query.has('verified'))setMessage('Email verified. Your DarkwaveCode account is active.');
 const requestedHandle=query.get('handle');
 try{const data=await api('auth/status');status.textContent='ACCOUNT API / CONNECTED';const google=$('#googleLogin'),emailAvailable=data.emailReady;$('#googleStatus').textContent=data.ready?'OAuth connection ready. Your Google account email remains private.':'Google sign-in is not configured yet. The site owner must add the Google OAuth credentials in Cloudflare.';if(!data.ready){google.classList.add('is-disabled');google.setAttribute('aria-disabled','true');google.addEventListener('click',event=>event.preventDefault())}else{google.classList.remove('is-disabled');google.removeAttribute('aria-disabled');google.href='/api/auth/google?return='+encodeURIComponent('/profile.html');google.textContent=data.user?(data.user.googleLinked?'GOOGLE ACCOUNT LINKED ✓':'LINK YOUR GOOGLE ACCOUNT ↗'):'CONTINUE WITH GOOGLE ↗'}if(data.user?.googleLinked)google.classList.add('is-disabled');if(!emailAvailable){$('#googleStatus').textContent+=(data.ready?' ':' ')+'Email verification is waiting for the Cloudflare sender-domain setup.';document.querySelector('[data-auth-mode="register"]').disabled=true;$('#forgotPassword').disabled=true;$('#resendVerification').disabled=true;}
   const user=data.user;
   if(requestedHandle){const profile=await api('profile?handle='+encodeURIComponent(requestedHandle));if(profile.owner){renderAccount(user||profile.user)}else{if(!user)$('#authPanel').hidden=true;form.hidden=true;$('#profileForm').hidden=true;setReadonlyProfile(profile.user);$('.profile-title-row h2').textContent='PUBLIC PROFILE';document.title=`@${profile.user.handle} — DarkwaveCode`}}
   else if(user){renderAccount(user);if(user.theme)applyTheme(user.theme);if(query.has('verified'))history.replaceState(null,'','profile.html')}
   else{renderAccount(null);if(draft.handle||draft.displayName)setFeedback('Your saved profile draft was restored from this browser. Sign in to sync it across devices.')}
 }catch(error){renderAccount(null);setMessage(error.message);$('#googleStatus').textContent='Could not reach the account service. Your profile draft stays on this device.'}
}

authForm.addEventListener('submit',async event=>{event.preventDefault();const button=$('#emailSubmit'),data=Object.fromEntries(new FormData(authForm));button.disabled=true;setMessage(mode==='register'?'Creating your account and sending verification…':'Checking your sign-in…');try{const result=await api(mode==='register'?'auth/email/register':'auth/email/login',{method:'POST',body:JSON.stringify(data)});if(mode==='register'){setMessage(result.message);setAuthMode('login');authForm.elements.email.value=data.email;$('#resendVerification').hidden=false}else{renderAccount(result.user);setMessage('Signed in. Your profile is synced.')}}catch(error){setMessage(error.message);if(error.message.toLowerCase().includes('verify'))$('#resendVerification').hidden=false}finally{button.disabled=false}});
$('#resendVerification').addEventListener('click',async()=>{try{const email=authForm.elements.email.value;const result=await api('auth/email/resend',{method:'POST',body:JSON.stringify({email})});setMessage(result.message)}catch(error){setMessage(error.message)}});
$('#forgotPassword').addEventListener('click',async()=>{const email=authForm.elements.email.value.trim();if(!email){setMessage('Enter your email address above first.');authForm.elements.email.focus();return}try{const result=await api('auth/email/forgot',{method:'POST',body:JSON.stringify({email})});setMessage(result.message)}catch(error){setMessage(error.message)}});
$('#resetForm').addEventListener('submit',async event=>{event.preventDefault();try{await api('auth/email/reset',{method:'POST',body:JSON.stringify({token:new URLSearchParams(location.search).get('reset'),password:event.target.elements.password.value})});const result=await api('auth/status');$('#resetForm').hidden=true;renderAccount(result.user);history.replaceState(null,'','profile.html');setMessage('Password changed. You are signed in.')}catch(error){setMessage(error.message)}});
form.addEventListener('submit',async event=>{event.preventDefault();const payload=collectProfile();payload.theme=$('#profileTheme').value||currentTheme;try{if(account){const result=await api('profile',{method:'PUT',body:JSON.stringify(payload)});account=result.user;hydrate(result.user);saveDraft(payload);setFeedback('Profile saved securely to your DarkwaveCode account.');$('#profileSync').textContent='ACCOUNT SYNC ON'}else{saveDraft(payload);setFeedback('Local profile draft saved in this browser. Sign in to publish and sync it.')}}catch(error){setFeedback(error.message)}});
$('#logoutButton').addEventListener('click',async()=>{try{await api('auth/logout',{method:'POST',body:'{}'});account=null;renderAccount(null);setMessage('You are signed out. Your local profile draft is still here.')}catch(error){setMessage(error.message)}});
$('#discardDraft').addEventListener('click',()=>{try{localStorage.removeItem('darkwave-profile-draft')}catch{}hydrate(profileDefaults);setFeedback('Profile draft reset on this device.')});
$('#shareProfile').addEventListener('click',async()=>{const url=new URL(`profile.html?handle=${encodeURIComponent(account.handle)}`,location.href).href;try{await navigator.clipboard.writeText(url);setFeedback('Profile link copied to clipboard.')}catch{setFeedback(url)}});
init();
