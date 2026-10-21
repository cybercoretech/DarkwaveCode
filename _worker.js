const COOKIE = 'dwc_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_SECONDS = 60 * 60 * 24;
const EMAIL_FROM = 'darkwavecode@cybercoretech.net';
const HANDLE = /^[A-Za-z0-9_]{3,24}$/;
const THEMES = new Set(['cyberpunk/cyberpunk-neon']);
const LANGUAGES = new Set(['JavaScript','Python','HTML + CSS','SQL','Bash','C','C++','Rust','Zig','Go','Java','C#','TypeScript','PHP','Kotlin','R','MATLAB','Swift','Ruby','Dart','Scala','Julia','Lua','Perl','Fortran','Assembly','Visual Basic','Objective-C','Delphi','SAS','D','COBOL','Haskell','PowerShell','Clojure','Crystal','Elixir','Elm','Erlang','Groovy','Mojo','PureScript','Vex']);
const LANGUAGE_IDS = new Set(['javascript','python','htmlcss','sql','bash','c','cpp','rust','zig','go','java','csharp','typescript','php','kotlin','r','swift','ruby','dart','scala','julia','lua','perl','assembly','haskell','powershell','clojure','crystal','elixir','elm','erlang','groovy','purescript','vex']);
const COURSE_IDS = new Set(['javascript','python','htmlcss','sql','bash','vex']);
const AVATARS = new Set(['neon-phantom','circuit-witch','void-rider','chrome-fox','pixel-oracle','night-owl','ghost-in-shell','star-forger','compiler-imp','stack-sentinel','memory-diver','packet-phantom','root-dragon','opcode-oni','cache-crow','thread-weaver']);

const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const randomToken = (size=32) => b64(crypto.getRandomValues(new Uint8Array(size)));
const digest = async value => b64(await crypto.subtle.digest('SHA-256', enc.encode(value)));
const now = () => Math.floor(Date.now()/1000);
const json = (data,status=200,headers={}) => Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const fail = (message,status=400) => Object.assign(new Error(message),{status});
const clean = (value,max=500) => typeof value==='string' ? value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').slice(0,max) : '';
const sameSecret = (left,right) => {const a=enc.encode(left),b=enc.encode(right);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0};
const cookieValue = (request,name) => (request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';
const sessionCookie = value => `${COOKIE}=${value}; Path=/; Max-Age=${value?SESSION_SECONDS:0}; HttpOnly; Secure; SameSite=Lax`;
const csrfCookie = value => `dwc_oauth=${value}; Path=/api/auth/google; Max-Age=${value?600:0}; HttpOnly; Secure; SameSite=Lax`;
const safeReturn = value => typeof value==='string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value.slice(0,300) : '/profile.html';

async function bodyJSON(request, limit=12000) {
  if(Number(request.headers.get('Content-Length')||0)>limit) throw fail('That request is too large.',413);
  const text=await request.text(); if(text.length>limit) throw fail('That request is too large.',413);
  try { return JSON.parse(text||'{}'); } catch { throw fail('Request data was not valid JSON.'); }
}
async function passwordHash(password,salt) {
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:210000,hash:'SHA-256'},key,256));
}
function isSiteAdmin(row,env) {
  const adminEmail=clean(env.ADMIN_EMAIL,254).toLowerCase();
  return !!adminEmail&&!!row?.google_sub&&!!row.email_verified&&row.email?.toLowerCase()===adminEmail;
}
function safeUser(row,owner=false,env={}) {
  return {id:row.id,handle:row.handle,displayName:row.display_name,bio:row.bio,favoriteLanguage:row.favorite_language,experienceLevel:row.experience_level,avatarKind:row.avatar_kind,avatarValue:row.avatar_value,avatarImage:row.avatar_image||'',theme:row.theme,createdAt:row.created_at, ...(owner?{email:row.email||'',emailVerified:!!row.email_verified,googleLinked:!!row.google_sub,isAdmin:isSiteAdmin(row,env),profileVisibility:row.profile_visibility,showActivity:!!row.show_activity,emailProductUpdates:!!row.email_product_updates}:{})};
}
async function currentUser(request,env) {
  const raw=cookieValue(request,COOKIE); if(!raw||!env.AUTH_DB)return null;
  const row=await env.AUTH_DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(raw),now()).first();
  if(row){const ban=await env.AUTH_DB.prepare('SELECT banned_until FROM user_bans WHERE user_id=?').bind(row.id).first();if(ban&&(ban.banned_until===null||ban.banned_until>now()))throw fail('This account is suspended. Contact DarkwaveCode support if you believe this is a mistake.',403)}
  return row||null;
}
const DEFAULT_SITE_SETTINGS={announcement:{enabled:false,text:'',link:'',linkLabel:''},visibleCourses:[...COURSE_IDS],visibleLanguages:[...LANGUAGE_IDS]};
async function readSiteSettings(db){const rows=(await db.prepare('SELECT key,value FROM admin_settings').all()).results||[],settings={...DEFAULT_SITE_SETTINGS};for(const row of rows){try{const value=JSON.parse(row.value);if(row.key==='announcement')settings.announcement=value;if(row.key==='visibleCourses')settings.visibleCourses=value;if(row.key==='visibleLanguages')settings.visibleLanguages=value}catch{}}return settings}
async function requireAdmin(user,env){if(!user||!isSiteAdmin(user,env))throw fail('Site administrator access is required.',403)}
async function recordAudit(db,actor,action,targetType,targetId,details={}){await db.prepare('INSERT INTO admin_audit(id,actor_id,action,target_type,target_id,details,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),actor.id,action,targetType,String(targetId),JSON.stringify(details),now()).run()}
async function startSession(db,userId) {
  const raw=randomToken(); const time=now();
  await db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').bind(await digest(raw),userId,time,time+SESSION_SECONDS).run();
  return raw;
}
async function authRate(db,key,maximum=8) {
  const t=now(),row=await db.prepare('SELECT count,window_started FROM auth_limits WHERE key=?').bind(key).first();
  if(row&&t-row.window_started<900&&row.count>=maximum)throw fail('Too many attempts. Wait 15 minutes and try again.',429);
  if(row&&t-row.window_started<900)await db.prepare('UPDATE auth_limits SET count=count+1 WHERE key=?').bind(key).run();
  else await db.prepare('INSERT INTO auth_limits(key,count,window_started) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,window_started=excluded.window_started').bind(key,t).run();
}
async function sendEmail(env,to,subject,text,html) {
  if(env.EMAIL){await env.EMAIL.send({from:EMAIL_FROM,to,subject,text,html});return;}
  if(!env.CF_EMAIL_API_TOKEN||!env.CF_ACCOUNT_ID)throw fail('Email delivery is not configured yet. Your account was not changed.',503);
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/email/sending/send`,{method:'POST',headers:{Authorization:`Bearer ${env.CF_EMAIL_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({from:EMAIL_FROM,to,subject,text,html})});
  let result={};try{result=await response.json()}catch{}
  if(!response.ok||result.success!==true)throw fail('Email delivery failed. Check the verified Cloudflare sender domain and try again.',503);
}
async function makeEmailToken(db,userId,purpose) {
  const raw=randomToken();
  await db.prepare('DELETE FROM email_tokens WHERE user_id=? AND purpose=?').bind(userId,purpose).run();
  await db.prepare('INSERT INTO email_tokens(token_hash,user_id,purpose,expires_at) VALUES(?,?,?,?)').bind(await digest(raw),userId,purpose,now()+TOKEN_SECONDS).run();
  return raw;
}
async function route(request,env) {
  const url=new URL(request.url), path=url.pathname;
  const db=env.AUTH_DB;
  if(path==='/admin'||path==='/admin/'||path==='/admin.html')return new Response('Not Found.',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  if(!path.startsWith('/api/')) return env.ASSETS.fetch(request);
  if(!db)return json({error:'Accounts are not connected yet. The site administrator must finish Cloudflare D1 setup.'},503);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{Allow:'GET, POST, PUT, OPTIONS'}});
  if(path==='/api/site/config'&&request.method==='GET')return json(await readSiteSettings(db));
  if(path==='/api/telemetry'&&request.method==='POST'){
    const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80),key=`telemetry:${(await digest(ip)).slice(0,32)}`;await authRate(db,key,160);
    const body=await bodyJSON(request,1000),event=body.event,label=clean(body.label,40);
    if(event==='run'&&!LANGUAGE_IDS.has(label))throw fail('Choose a supported language for telemetry.');
    if(event==='page'&&!new Set(['home','workbench','ghostkernel','course','profile','community','templates']).has(label))throw fail('Choose a supported page for telemetry.');
    if(event==='course_complete'&&!COURSE_IDS.has(label))throw fail('Choose a supported course for telemetry.');
    if(!['run','page','course_complete'].includes(event))throw fail('Choose a supported telemetry event.');
    const success=event==='run'&&body.success===true?1:0,duration=event==='run'&&Number.isFinite(body.durationMs)?Math.max(0,Math.min(120000,Math.round(body.durationMs))):0,day=new Date().toISOString().slice(0,10);
    await db.prepare('INSERT INTO telemetry_daily(day,event,label,event_count,success_count,duration_total) VALUES(?,?,?,1,?,?) ON CONFLICT(day,event,label) DO UPDATE SET event_count=event_count+1,success_count=success_count+excluded.success_count,duration_total=duration_total+excluded.duration_total').bind(day,event,label,success,duration).run();
    return json({ok:true});
  }
  if(path==='/api/auth/status'&&request.method==='GET'){
    const user=await currentUser(request,env); return json({ready:!!env.GOOGLE_CLIENT_ID&&!!env.GOOGLE_CLIENT_SECRET, emailReady:!!env.EMAIL||(!!env.CF_EMAIL_API_TOKEN&&!!env.CF_ACCOUNT_ID), user:user?safeUser(user,true,env):null});
  }
  if(path==='/api/auth/google'&&request.method==='GET'){
    if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return json({error:'Google sign-in is not configured yet.'},503);
    const canonicalOrigin=env.SITE_ORIGIN?new URL(env.SITE_ORIGIN).origin:url.origin;
    if(url.origin!==canonicalOrigin){const canonical=new URL('/api/auth/google',canonicalOrigin);canonical.search=url.search;return Response.redirect(canonical.href,302)}
    const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80);await authRate(db,`google:${ip}`,12);
    const state=randomToken(32),verifier=randomToken(48),challenge=b64(await crypto.subtle.digest('SHA-256',enc.encode(verifier))),returnTo=safeReturn(url.searchParams.get('return'));
    await db.prepare('DELETE FROM oauth_states WHERE expires_at<?').bind(now()).run();
    const linkingUser=await currentUser(request,env);
    await db.prepare('INSERT INTO oauth_states(state_hash,verifier,return_to,link_user_id,expires_at) VALUES(?,?,?,?,?)').bind(await digest(state),verifier,returnTo,linkingUser?.id||null,now()+600).run();
    const callback=new URL('/api/auth/google/callback',canonicalOrigin),target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    for(const [k,v] of Object.entries({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:callback.href,response_type:'code',scope:'openid email profile',state,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}))target.searchParams.set(k,v);
    return new Response(null,{status:302,headers:{Location:target.href,'Set-Cookie':csrfCookie(state),'Cache-Control':'no-store'}});
  }
  if(path==='/api/auth/google/callback'&&request.method==='GET'){
    const state=url.searchParams.get('state')||'',cookie=cookieValue(request,'dwc_oauth');
    if(!state||!cookie||state!==cookie)return Response.redirect(new URL('/profile.html?auth_error=state',url.origin),303);
    const saved=await db.prepare('SELECT * FROM oauth_states WHERE state_hash=? AND expires_at>?').bind(await digest(state),now()).first();
    await db.prepare('DELETE FROM oauth_states WHERE state_hash=?').bind(await digest(state)).run();
    if(!saved)return Response.redirect(new URL('/profile.html?auth_error=expired',url.origin),303);
    if(url.searchParams.has('error'))return Response.redirect(new URL('/profile.html?auth_error=cancelled',url.origin),303);
    try {
      const callbackOrigin=env.SITE_ORIGIN?new URL(env.SITE_ORIGIN).origin:url.origin;
      const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:url.searchParams.get('code')||'',client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:new URL('/api/auth/google/callback',callbackOrigin).href,grant_type:'authorization_code',code_verifier:saved.verifier})});
      if(!tokenResponse.ok)throw new Error('Google token exchange failed');
      const tokenData=await tokenResponse.json();
      const infoResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokenData.access_token}`}});
      if(!infoResponse.ok)throw new Error('Google identity check failed');
      const info=await infoResponse.json();
      if(!info.sub||!info.email||info.email_verified!==true)throw new Error('Google did not return a verified email address');
      let user=await db.prepare('SELECT * FROM users WHERE google_sub=?').bind(info.sub).first();
      if(user){const ban=await db.prepare('SELECT banned_until FROM user_bans WHERE user_id=?').bind(user.id).first();if(ban&&(ban.banned_until===null||ban.banned_until>now()))return new Response(null,{status:303,headers:{Location:new URL('/profile.html?auth_error=banned',url.origin).href,'Cache-Control':'no-store'}})}
      if(saved.link_user_id){
        const account=await db.prepare('SELECT * FROM users WHERE id=?').bind(saved.link_user_id).first();
        if(!account)throw new Error('The account being linked is no longer available');
        const accountBan=await db.prepare('SELECT banned_until FROM user_bans WHERE user_id=?').bind(account.id).first();if(accountBan&&(accountBan.banned_until===null||accountBan.banned_until>now()))return new Response(null,{status:303,headers:{Location:new URL('/profile.html?auth_error=banned',url.origin).href,'Cache-Control':'no-store'}});
        if(user&&user.id!==account.id)throw new Error('This Google account is already linked to another DarkwaveCode account');
        if(!user){await db.prepare('UPDATE users SET google_sub=?,updated_at=? WHERE id=?').bind(info.sub,now(),account.id).run();user=await db.prepare('SELECT * FROM users WHERE id=?').bind(account.id).first();}
        const destination=new URL(safeReturn(saved.return_to),url.origin);
        return new Response(null,{status:303,headers:{Location:destination.href,'Set-Cookie':sessionCookie(await startSession(db,user.id)),'Cache-Control':'no-store'}});
      }
      if(!user){
        const emailOwner=await db.prepare('SELECT id FROM users WHERE email=?').bind(info.email.toLowerCase()).first();
        if(emailOwner)throw new Error('This email already has a password account. Sign in with email first, then connect Google from your profile.');
        const base=(info.name||info.email.split('@')[0]).normalize('NFKD').replace(/[^A-Za-z0-9_]/g,'').slice(0,17)||'NightCoder';let handle=base,tries=0;
        while(await db.prepare('SELECT 1 FROM users WHERE handle=?').bind(handle).first()){handle=`${base}${++tries}`.slice(0,24);}
        const id=crypto.randomUUID(),t=now();
        await db.prepare('INSERT INTO users(id,google_sub,email,email_verified,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,info.sub,info.email.toLowerCase(),1,handle,clean(info.name,40)||handle,t,t).run();
        user=await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
      }
      const session=await startSession(db,user.id),destination=new URL(safeReturn(saved.return_to),url.origin);
      const headers=new Headers({'Location':destination.href,'Cache-Control':'no-store'});headers.append('Set-Cookie',sessionCookie(session));headers.append('Set-Cookie',csrfCookie(''));
      return new Response(null,{status:303,headers});
    } catch(error) {console.error('Google sign-in failure:',error?.message||error);return new Response(null,{status:303,headers:{Location:new URL('/profile.html?auth_error=google',url.origin).href,'Set-Cookie':csrfCookie(''),'Cache-Control':'no-store'}})}
  }
  if(path==='/api/auth/email/register'&&request.method==='POST'){
    const body=await bodyJSON(request); const email=clean(body.email,254).toLowerCase(),password=body.password;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail('Enter a valid email address.');
    if(typeof password!=='string'||password.length<12||password.length>128)throw fail('Use a password between 12 and 128 characters.');
    if(!env.EMAIL&&!(env.CF_EMAIL_API_TOKEN&&env.CF_ACCOUNT_ID))throw fail('Email verification is not configured yet. Please use Google sign-in or try later.',503);
    const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80);await authRate(db,`register:${ip}`,4);
    if(await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first())throw fail('An account already uses that email. Sign in or request a password reset.',409);
    let handle=clean(body.handle,24);if(!HANDLE.test(handle))throw fail('Choose a handle with 3–24 letters, numbers, or underscores.');
    if(await db.prepare('SELECT id FROM users WHERE handle=?').bind(handle).first())throw fail('That handle is already taken.',409);
    const salt=randomToken(16),hash=await passwordHash(password,salt),id=crypto.randomUUID(),t=now();
    await db.prepare('INSERT INTO users(id,email,email_verified,password_salt,password_hash,handle,display_name,created_at,updated_at) VALUES(?,?,0,?,?,?,?,?,?)').bind(id,email,salt,hash,handle,clean(body.displayName,40)||handle,t,t).run();
    const token=await makeEmailToken(db,id,'verify'),link=new URL(`/api/auth/email/verify?token=${encodeURIComponent(token)}`,url.origin).href;
    await sendEmail(env,email,'Verify your DarkwaveCode account',`Welcome to DarkwaveCode. Verify your email within 24 hours: ${link}\n\nIf you did not create this account, ignore this email.`,`<p>Welcome to DarkwaveCode.</p><p><a href="${link}">Verify your email address</a> within 24 hours.</p><p>If you did not create this account, ignore this email.</p>`);
    return json({ok:true,message:'Check your inbox for a verification link. It expires in 24 hours.'},201);
  }
  if(path==='/api/auth/email/verify'&&request.method==='GET'){
    const token=url.searchParams.get('token')||'',row=await db.prepare("SELECT user_id FROM email_tokens WHERE token_hash=? AND purpose='verify' AND expires_at>?").bind(await digest(token),now()).first();
    if(!row)return Response.redirect(new URL('/profile.html?auth_error=verify',url.origin),303);
    await db.batch([db.prepare('UPDATE users SET email_verified=1,updated_at=? WHERE id=?').bind(now(),row.user_id),db.prepare('DELETE FROM email_tokens WHERE user_id=? AND purpose=?').bind(row.user_id,'verify')]);
    const session=await startSession(db,row.user_id);
    return new Response(null,{status:303,headers:{Location:new URL('/profile.html?verified=1',url.origin).href,'Set-Cookie':sessionCookie(session),'Cache-Control':'no-store'}});
  }
  if(path==='/api/auth/email/login'&&request.method==='POST'){
    const body=await bodyJSON(request),email=clean(body.email,254).toLowerCase(),password=typeof body.password==='string'?body.password.slice(0,128):'',ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80);
    await authRate(db,`login:${ip}`,10);
    const user=await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    const salt=user?.password_salt||randomToken(16),attempt=await passwordHash(password,salt);
    if(!user?.password_hash||!sameSecret(attempt,user.password_hash))throw fail('Email or password is incorrect.',401);
    if(!user.email_verified)throw fail('Verify your email first. Use the resend link to get a fresh message.',403);
    const ban=await db.prepare('SELECT banned_until FROM user_bans WHERE user_id=?').bind(user.id).first();if(ban&&(ban.banned_until===null||ban.banned_until>now()))throw fail('This account is suspended. Contact DarkwaveCode support if you believe this is a mistake.',403);
    return json({ok:true,user:safeUser(user,true,env)},200,{'Set-Cookie':sessionCookie(await startSession(db,user.id))});
  }
  if(path==='/api/auth/email/resend'&&request.method==='POST'){
    const body=await bodyJSON(request),email=clean(body.email,254).toLowerCase(),user=await db.prepare('SELECT * FROM users WHERE email=? AND email_verified=0').bind(email).first();
    const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80);await authRate(db,`resend:${ip}`,4);
    if(user){const token=await makeEmailToken(db,user.id,'verify'),link=new URL(`/api/auth/email/verify?token=${encodeURIComponent(token)}`,url.origin).href;await sendEmail(env,email,'Verify your DarkwaveCode account',`Verify your email: ${link}`,`<p><a href="${link}">Verify your DarkwaveCode email</a></p>`)}
    return json({ok:true,message:'If that address has an unverified account, a new link is on the way.'});
  }
  if(path==='/api/auth/email/forgot'&&request.method==='POST'){
    const body=await bodyJSON(request),email=clean(body.email,254).toLowerCase(),user=await db.prepare('SELECT * FROM users WHERE email=? AND password_hash IS NOT NULL AND email_verified=1').bind(email).first();
    const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,80);await authRate(db,`forgot:${ip}`,4);
    if(user){const token=await makeEmailToken(db,user.id,'reset'),link=new URL(`/profile.html?reset=${encodeURIComponent(token)}`,url.origin).href;await sendEmail(env,email,'Reset your DarkwaveCode password',`Reset your password within 24 hours: ${link}`,`<p><a href="${link}">Reset your DarkwaveCode password</a> within 24 hours.</p>`)}
    return json({ok:true,message:'If a verified account uses that email, a reset link is on the way.'});
  }
  if(path==='/api/auth/email/reset'&&request.method==='POST'){
    const body=await bodyJSON(request),token=clean(body.token,200),password=body.password;
    if(typeof password!=='string'||password.length<12||password.length>128)throw fail('Use a password between 12 and 128 characters.');
    const row=await db.prepare("SELECT user_id FROM email_tokens WHERE token_hash=? AND purpose='reset' AND expires_at>?").bind(await digest(token),now()).first();if(!row)throw fail('That reset link expired or was already used.',410);
    const salt=randomToken(16),hash=await passwordHash(password,salt),session=await startSession(db,row.user_id);
    await db.batch([db.prepare('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?').bind(salt,hash,now(),row.user_id),db.prepare("DELETE FROM email_tokens WHERE user_id=? AND purpose='reset'").bind(row.user_id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(row.user_id)]);
    await db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').bind(await digest(session),row.user_id,now(),now()+SESSION_SECONDS).run();
    return json({ok:true},200,{'Set-Cookie':sessionCookie(session)});
  }
  if(path==='/api/auth/logout'&&request.method==='POST'){
    const raw=cookieValue(request,COOKIE);if(raw)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(raw)).run();return json({ok:true},200,{'Set-Cookie':sessionCookie('')});
  }
  const user=await currentUser(request,env);
  if(path==='/api/community'&&request.method==='GET'){
    const threads=await db.prepare("SELECT t.id,t.category,t.title,t.body,t.created_at,t.updated_at,t.is_locked,u.id AS author_id,u.handle,u.display_name,(SELECT COUNT(*) FROM discussion_replies r WHERE r.thread_id=t.id AND r.is_hidden=0) AS reply_count FROM discussion_threads t JOIN users u ON u.id=t.author_id WHERE t.is_hidden=0 ORDER BY t.updated_at DESC LIMIT 60").all();
    return json({threads:threads.results||[],user:user?safeUser(user,true,env):null});
  }
  if(path==='/api/community/replies'&&request.method==='GET'){
    const threadId=clean(url.searchParams.get('thread'),64),thread=await db.prepare('SELECT id,is_hidden FROM discussion_threads WHERE id=?').bind(threadId).first();if(!thread||thread.is_hidden)throw fail('That discussion is not available.',404);
    const replies=await db.prepare('SELECT r.id,r.body,r.created_at,u.id AS author_id,u.handle,u.display_name FROM discussion_replies r JOIN users u ON u.id=r.author_id WHERE r.thread_id=? AND r.is_hidden=0 ORDER BY r.created_at ASC LIMIT 200').bind(threadId).all();return json({replies:replies.results||[]});
  }
  if(path==='/api/community/thread'&&request.method==='POST'){
    if(!user)throw fail('Sign in to start a discussion.',401);await authRate(db,`thread:${user.id}`,5);
    const body=await bodyJSON(request,5000),title=clean(body.title,100),content=clean(body.body,2000),category=body.category;
    if(title.length<4||content.length<10)throw fail('Use a title of at least 4 characters and a post of at least 10 characters.');
    if(!['general','help','showcase','courses','workbench'].includes(category))throw fail('Choose a discussion category.');
    const id=crypto.randomUUID(),timestamp=now();await db.prepare('INSERT INTO discussion_threads(id,author_id,category,title,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,user.id,category,title,content,timestamp,timestamp).run();
    return json({ok:true,id},201);
  }
  if(path==='/api/community/reply'&&request.method==='POST'){
    if(!user)throw fail('Sign in to reply to a discussion.',401);await authRate(db,`reply:${user.id}`,20);
    const body=await bodyJSON(request,3000),threadId=clean(body.threadId,64),content=clean(body.body,2000),thread=await db.prepare('SELECT id,is_hidden,is_locked FROM discussion_threads WHERE id=?').bind(threadId).first();
    if(!thread||thread.is_hidden)throw fail('That discussion is not available.',404);if(thread.is_locked)throw fail('This discussion is locked by a moderator.',409);if(content.length<2)throw fail('Write at least two characters before posting.');
    const id=crypto.randomUUID(),timestamp=now();await db.batch([db.prepare('INSERT INTO discussion_replies(id,thread_id,author_id,body,created_at) VALUES(?,?,?,?,?)').bind(id,threadId,user.id,content,timestamp),db.prepare('UPDATE discussion_threads SET updated_at=? WHERE id=?').bind(timestamp,threadId)]);return json({ok:true,id},201);
  }
  if(path==='/api/community/report'&&request.method==='POST'){
    if(!user)throw fail('Sign in to report a discussion post.',401);await authRate(db,`report:${user.id}`,12);
    const body=await bodyJSON(request,1000),threadId=clean(body.threadId,64),replyId=clean(body.replyId,64),reason=clean(body.reason,400);if(Boolean(threadId)===Boolean(replyId))throw fail('Select one discussion item to report.');if(reason.length<5)throw fail('Explain briefly why this needs moderator attention.');
    if(threadId&&!await db.prepare('SELECT id FROM discussion_threads WHERE id=?').bind(threadId).first())throw fail('That discussion was not found.',404);
    if(replyId&&!await db.prepare('SELECT id FROM discussion_replies WHERE id=?').bind(replyId).first())throw fail('That reply was not found.',404);
    const duplicate=await db.prepare("SELECT id FROM discussion_reports WHERE reporter_id=? AND status='open' AND ((thread_id=? AND ?<>'') OR (reply_id=? AND ?<>''))").bind(user.id,threadId,threadId,replyId,replyId).first();if(duplicate)throw fail('You already reported that item. A moderator will review it.',409);
    await db.prepare('INSERT INTO discussion_reports(id,reporter_id,thread_id,reply_id,reason,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),user.id,threadId||null,replyId||null,reason,now()).run();return json({ok:true,message:'Report sent to the site moderator.'},201);
  }
  if(path==='/api/admin/overview'&&request.method==='GET'){
    await requireAdmin(user,env);
    const [users,bans,events,audit,totals,reports,hiddenContent]=await Promise.all([
      db.prepare('SELECT u.id,u.handle,u.display_name,u.favorite_language,u.created_at,b.banned_until,b.reason,CASE WHEN b.user_id IS NULL THEN 0 ELSE 1 END AS is_banned FROM users u LEFT JOIN user_bans b ON b.user_id=u.id ORDER BY u.created_at DESC LIMIT 100').all(),
      db.prepare('SELECT COUNT(*) AS total FROM user_bans WHERE banned_until IS NULL OR banned_until>?').bind(now()).first(),
      db.prepare("SELECT day,event,label,event_count,success_count,duration_total FROM telemetry_daily WHERE day>=date('now','-30 day') ORDER BY day DESC").all(),
      db.prepare('SELECT a.action,a.target_type,a.target_id,a.details,a.created_at,u.handle FROM admin_audit a JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 25').all(),
      db.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN created_at>=? THEN 1 ELSE 0 END) AS new_users FROM users').bind(now()-7*86400).first(),
      db.prepare("SELECT r.id,r.thread_id,r.reply_id,r.reason,r.created_at,u.handle AS reporter,COALESCE(t.title,'Reply in: '||parent.title) AS subject,COALESCE(t.body,child.body) AS excerpt,COALESCE(r.thread_id,child.thread_id) AS target_thread FROM discussion_reports r JOIN users u ON u.id=r.reporter_id LEFT JOIN discussion_threads t ON t.id=r.thread_id LEFT JOIN discussion_replies child ON child.id=r.reply_id LEFT JOIN discussion_threads parent ON parent.id=child.thread_id WHERE r.status='open' ORDER BY r.created_at DESC LIMIT 100").all(),
      db.prepare("SELECT id AS target_id,'thread' AS target_type,title AS label,updated_at AS created_at FROM discussion_threads WHERE is_hidden=1 UNION ALL SELECT r.id,'reply',t.title||' · reply by @'||u.handle,r.created_at FROM discussion_replies r JOIN discussion_threads t ON t.id=r.thread_id JOIN users u ON u.id=r.author_id WHERE r.is_hidden=1 ORDER BY created_at DESC LIMIT 100").all()
    ]);
    return json({settings:await readSiteSettings(db),users:users.results||[],activeBans:bans?.total||0,events:events.results||[],audit:audit.results||[],reports:reports.results||[],hiddenContent:hiddenContent.results||[],totals:{users:totals?.total||0,newUsers7d:totals?.new_users||0},health:{accountDatabase:!!db,googleOAuth:!!env.GOOGLE_CLIENT_ID&&!!env.GOOGLE_CLIENT_SECRET,emailDelivery:!!env.EMAIL||!!(env.CF_EMAIL_API_TOKEN&&env.CF_ACCOUNT_ID),generatedAt:now()}});
  }
  if(path==='/api/admin/settings'&&request.method==='PUT'){
    await requireAdmin(user,env);const body=await bodyJSON(request),announcement=body.announcement;
    if(!announcement||typeof announcement.enabled!=='boolean')throw fail('Set the announcement status.');
    const text=clean(announcement.text,240),link=clean(announcement.link,300),linkLabel=clean(announcement.linkLabel,32);
    if(announcement.enabled&&!text)throw fail('Add announcement text before publishing it.');
    if(link&&!/^https:\/\//i.test(link)&&!/^\/[A-Za-z0-9_/?#=&%.-]*$/.test(link))throw fail('Use an https link or a site-relative path.');
    const visibleCourses=body.visibleCourses,visibleLanguages=body.visibleLanguages;
    if(!Array.isArray(visibleCourses)||visibleCourses.some(id=>!COURSE_IDS.has(id)))throw fail('The course visibility list is invalid.');
    if(!Array.isArray(visibleLanguages)||!visibleLanguages.includes('javascript')||visibleLanguages.some(id=>!LANGUAGE_IDS.has(id)))throw fail('Keep JavaScript enabled and choose valid language IDs.');
    const timestamp=now(),entries=[['announcement',{enabled:announcement.enabled,text,link,linkLabel}],['visibleCourses',visibleCourses],['visibleLanguages',visibleLanguages]];
    await db.batch(entries.map(([key,value])=>db.prepare('INSERT INTO admin_settings(key,value,updated_at,updated_by) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(key,JSON.stringify(value),timestamp,user.id)));
    await recordAudit(db,user,'site_settings_updated','site','settings',{announcementEnabled:announcement.enabled,visibleCourses:visibleCourses.length,visibleLanguages:visibleLanguages.length});
    return json({ok:true,settings:await readSiteSettings(db)});
  }
  if(path==='/api/admin/users/ban'&&request.method==='POST'){
    await requireAdmin(user,env);const body=await bodyJSON(request),targetId=clean(body.userId,64),reason=clean(body.reason,240),duration=body.duration;
    if(!targetId||!reason)throw fail('Choose a user and enter a moderation reason.');
    const target=await db.prepare('SELECT * FROM users WHERE id=?').bind(targetId).first();if(!target)throw fail('That account was not found.',404);
    if(isSiteAdmin(target,env))throw fail('The site administrator account cannot be banned.',403);
    const seconds={hour:3600,day:86400,week:604800,month:2592000,permanent:null}[duration];if(seconds===undefined)throw fail('Choose a valid suspension length.');
    const until=seconds===null?null:now()+seconds;
    await db.prepare('INSERT INTO user_bans(user_id,banned_until,reason,actor_id,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET banned_until=excluded.banned_until,reason=excluded.reason,actor_id=excluded.actor_id,updated_at=excluded.updated_at').bind(targetId,until,reason,user.id,now()).run();
    await db.prepare('DELETE FROM sessions WHERE user_id=?').bind(targetId).run();
    await recordAudit(db,user,'user_banned','user',targetId,{duration,reason});return json({ok:true});
  }
  if(path==='/api/admin/users/unban'&&request.method==='POST'){
    await requireAdmin(user,env);const body=await bodyJSON(request),targetId=clean(body.userId,64);if(!targetId)throw fail('Choose an account to restore.');
    await db.prepare('DELETE FROM user_bans WHERE user_id=?').bind(targetId).run();await recordAudit(db,user,'user_unbanned','user',targetId);return json({ok:true});
  }
  if(path==='/api/admin/community/moderate'&&request.method==='POST'){
    await requireAdmin(user,env);const body=await bodyJSON(request),reportId=clean(body.reportId,64),action=body.action,targetId=clean(body.targetId,64),targetType=body.targetType;
    const report=reportId?await db.prepare('SELECT * FROM discussion_reports WHERE id=?').bind(reportId).first():null;if(reportId&&!report)throw fail('That moderation report was not found.',404);
    const replyId=report?.reply_id||(targetType==='reply'?targetId:''),threadTarget=report?.thread_id||(targetType==='thread'?targetId:'');
    const reply=replyId?await db.prepare('SELECT thread_id FROM discussion_replies WHERE id=?').bind(replyId).first():null,threadId=threadTarget||reply?.thread_id;
    if(action==='hide_thread'||action==='restore_thread')await db.prepare('UPDATE discussion_threads SET is_hidden=? WHERE id=?').bind(action==='hide_thread'?1:0,threadId).run();
    else if(action==='hide_reply'||action==='restore_reply'){if(!replyId)throw fail('This action requires a reply target.');await db.prepare('UPDATE discussion_replies SET is_hidden=? WHERE id=?').bind(action==='hide_reply'?1:0,replyId).run()}
    else if(action==='lock_thread'||action==='unlock_thread')await db.prepare('UPDATE discussion_threads SET is_locked=? WHERE id=?').bind(action==='lock_thread'?1:0,threadId).run();
    else if(action==='resolve_report'){if(!report)throw fail('Choose a report to resolve.');await db.prepare("UPDATE discussion_reports SET status='resolved' WHERE id=?").bind(reportId).run()}
    else throw fail('Choose a valid moderation action.');
    await recordAudit(db,user,`discussion_${action}`,report?'report':targetType||'thread',reportId||targetId,{threadId});return json({ok:true});
  }
  if(path==='/api/profile'&&request.method==='GET'){
    const handle=clean(url.searchParams.get('handle'),24);let row;
    if(handle){row=await db.prepare('SELECT * FROM users WHERE handle=?').bind(handle).first();if(!row)throw fail('Profile not found.',404);if(row.profile_visibility==='private'&&row.id!==user?.id)throw fail('This profile is private.',404);if(row.profile_visibility==='members'&&!user)throw fail('Sign in to view this profile.',401);}
    else row=user;
    if(!row)throw fail('Sign in to manage your profile.',401);
    return json({user:safeUser(row,row.id===user?.id,env),owner:row.id===user?.id});
  }
  if(path==='/api/profile'&&request.method==='PUT'){
    if(!user)throw fail('Sign in to save profile settings.',401);
    const body=await bodyJSON(request,600000),handle=clean(body.handle,24),displayName=clean(body.displayName,40)||handle;
    if(!HANDLE.test(handle))throw fail('Choose a handle with 3–24 letters, numbers, or underscores.');
    const visibility=body.profileVisibility;if(!['public','members','private'].includes(visibility))throw fail('Choose a profile visibility.');
    const kind=body.avatarKind,value=clean(body.avatarValue,300),image=typeof body.avatarImage==='string'?body.avatarImage:'';
    if(!['emoji','art','image'].includes(kind))throw fail('Choose an avatar type.');
    if(kind==='art'&&!AVATARS.has(value))throw fail('Choose one of the DarkwaveCode avatar designs.');
    if(kind==='emoji'&&(!value||[...value].length>8))throw fail('Choose a valid emoji avatar.');
    if(kind==='image'&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw fail('Upload a PNG, JPEG, or WebP profile image.');
    if(image.length>420000)throw fail('Profile images must be under 300 KB after compression.',413);
    const theme=clean(body.theme,80);if(!THEMES.has(theme)&&!/^([a-z0-9-]+)\/[a-z0-9-]+$/.test(theme))throw fail('Choose a Cybercore theme.');
    const language=clean(body.favoriteLanguage,40);if(!LANGUAGES.has(language))throw fail('Choose a supported language.');
    const level=clean(body.experienceLevel,30);if(!['curious','beginner','intermediate','advanced'].includes(level))throw fail('Choose an experience level.');
    try{await db.prepare('UPDATE users SET handle=?,display_name=?,bio=?,favorite_language=?,experience_level=?,avatar_kind=?,avatar_value=?,avatar_image=?,theme=?,profile_visibility=?,show_activity=?,email_product_updates=?,updated_at=? WHERE id=?').bind(handle,displayName,clean(body.bio,400),language,level,kind,value,kind==='image'?image:'',theme,visibility,body.showActivity?1:0,body.emailProductUpdates?1:0,now(),user.id).run();}
    catch(error){if(String(error.message||'').includes('UNIQUE constraint failed: users.handle'))throw fail('That handle is already in use.',409);throw error;}
    const updated=await db.prepare('SELECT * FROM users WHERE id=?').bind(user.id).first();return json({ok:true,user:safeUser(updated,true,env)});
  }
  throw fail('Not found.',404);
}

export default { async fetch(request,env) {
  try {
    const url=new URL(request.url);
    const canonicalOrigin=env.SITE_ORIGIN?new URL(env.SITE_ORIGIN).origin:url.origin;
    if(url.pathname.startsWith('/api/')&&url.origin!==canonicalOrigin&&request.method!=='GET'&&request.method!=='OPTIONS')return json({error:'Account changes are only accepted on the production site.'},403);
    if(url.pathname.startsWith('/api/')&&request.method!=='GET'){
      const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Request origin rejected.'},403);
      if(request.method!=='POST'&&request.method!=='PUT'&&request.method!=='OPTIONS')return json({error:'Method not allowed.'},405,{Allow:'GET, POST, PUT, OPTIONS'});
    }
    return await route(request,env);
  } catch(error) {
    if(error?.status)return json({error:error.message},error.status);
    console.error('DarkwaveCode account request failed:',error?.message||error);return json({error:'The account service could not complete that request. Please try again.'},503);
  }
} };
