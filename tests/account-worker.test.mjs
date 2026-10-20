import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../_worker.js',import.meta.url),'utf8');
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function fakeDb(user=null,banned=false){
 const writes=[];
 return {writes,prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){if(sql.startsWith('SELECT count,window_started'))return null;if(sql.includes('FROM sessions s JOIN users u'))return user;if(sql.includes('FROM user_bans'))return banned?{banned_until:null}:null;return null},async run(){writes.push({sql,args});return {success:true}},async all(){return {results:[]}}}},async batch(items){for(const item of items)await item.run()}};
}

test('static assets pass through the Pages asset binding',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/profile.html'),{ASSETS:{fetch:async()=>new Response('profile asset')}});
 assert.equal(response.status,200);assert.equal(await response.text(),'profile asset');
});

test('account status reports provider readiness without exposing identity data',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/auth/status'),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.deepEqual(await response.json(),{ready:false,emailReady:false,user:null});
});

test('only the verified Google account configured as administrator receives the admin flag',async()=>{
 const owner={id:'owner',email:'darkstardevx@gmail.com',email_verified:1,google_sub:'google-sub',handle:'darkstardevx',display_name:'Darkstar Devx'};
 const request=new Request('https://darkwavecode.pages.dev/api/auth/status',{headers:{Cookie:'dwc_session=test-session'}});
 const response=await worker.fetch(request,{AUTH_DB:fakeDb(owner),ADMIN_EMAIL:'darkstardevx@gmail.com'});
 assert.equal((await response.json()).user.isAdmin,true);
 const passwordOnly={...owner,google_sub:null};
 const denied=await worker.fetch(request,{AUTH_DB:fakeDb(passwordOnly),ADMIN_EMAIL:'darkstardevx@gmail.com'});
 assert.equal((await denied.json()).user.isAdmin,false);
});

test('Google OAuth uses canonical origin, PKCE, and rejects an unsafe return URL',async()=>{
 const db=fakeDb(),request=new Request('https://darkwavecode.pages.dev/api/auth/google?return=%2F%2Fevil.example',{headers:{'CF-Connecting-IP':'192.0.2.10'}});
 const response=await worker.fetch(request,{AUTH_DB:db,GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 const location=new URL(response.headers.get('Location'));
 assert.equal(response.status,302);assert.equal(location.origin,'https://accounts.google.com');assert.equal(location.searchParams.get('redirect_uri'),'https://darkwavecode.pages.dev/api/auth/google/callback');
 assert.equal(location.searchParams.get('code_challenge_method'),'S256');assert.ok(location.searchParams.get('code_challenge'));
 assert.match(response.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Lax/);
 const stateWrite=db.writes.find(write=>write.sql.startsWith('INSERT INTO oauth_states'));
 assert.ok(stateWrite);assert.equal(stateWrite.args[2],'/profile.html');
});

test('state-changing account requests reject another origin',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/auth/email/login',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'}),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,403);assert.match((await response.json()).error,/origin/i);
});

test('anonymous users cannot read account profiles',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/profile'),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,401);
});

test('preview deployment cannot mutate production account data',async()=>{
 const response=await worker.fetch(new Request('https://preview.darkwavecode.pages.dev/api/auth/email/register',{method:'POST',headers:{Origin:'https://preview.darkwavecode.pages.dev','Content-Type':'application/json'},body:'{}'}),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,403);
});

test('private admin overview rejects signed-in non-admin accounts',async()=>{
 const member={id:'member',email:'member@example.com',email_verified:1,google_sub:'member-google',handle:'member01',display_name:'Member'};
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/admin/overview',{headers:{Cookie:'dwc_session=test-session'}}),{AUTH_DB:fakeDb(member),ADMIN_EMAIL:'darkstardevx@gmail.com',SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,403);
});

test('active bans deny access even when an old session cookie remains',async()=>{
 const member={id:'member',email:'member@example.com',email_verified:1,google_sub:'member-google',handle:'member01',display_name:'Member'};
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/profile',{headers:{Cookie:'dwc_session=old-session'}}),{AUTH_DB:fakeDb(member,true),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,403);assert.match((await response.json()).error,/suspended/i);
});

test('public site settings provide launch defaults without exposing secrets',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/site/config'),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,200);const data=await response.json();
 assert.equal(data.announcement.enabled,false);assert.deepEqual(data.visibleCourses,['javascript','python','htmlcss','sql','bash']);assert.ok(data.visibleLanguages.includes('javascript'));
});

test('anonymous telemetry stores only daily aggregate events and validates language IDs',async()=>{
 const db=fakeDb(),request=new Request('https://darkwavecode.pages.dev/api/telemetry',{method:'POST',headers:{Origin:'https://darkwavecode.pages.dev','CF-Connecting-IP':'203.0.113.23','Content-Type':'application/json'},body:JSON.stringify({event:'run',label:'javascript',success:true,durationMs:12})});
 const response=await worker.fetch(request,{AUTH_DB:db,SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,200);assert.ok(db.writes.some(write=>write.sql.includes('INSERT INTO telemetry_daily')));assert.ok(!JSON.stringify(db.writes).includes('203.0.113.23'));
 const invalid=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/telemetry',{method:'POST',headers:{Origin:'https://darkwavecode.pages.dev','Content-Type':'application/json'},body:JSON.stringify({event:'run',label:'made-up-language'})}),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(invalid.status,400);
});

test('community topics require an authenticated member but reading is public',async()=>{
 const publicRead=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/community'),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(publicRead.status,200);assert.deepEqual((await publicRead.json()).threads,[]);
 const create=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/community/thread',{method:'POST',headers:{Origin:'https://darkwavecode.pages.dev','Content-Type':'application/json'},body:JSON.stringify({category:'help',title:'Compiler question',body:'I am learning how the compiler reports type errors.'})}),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(create.status,401);
});

test('admin console shortcut APIs enforce the verified Google admin role',async()=>{
 const owner={id:'owner',email:'darkstardevx@gmail.com',email_verified:1,google_sub:'google-sub',handle:'darkstardevx',display_name:'Darkstar Devx'};
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/admin/overview',{headers:{Cookie:'dwc_session=test-session'}}),{AUTH_DB:fakeDb(owner),ADMIN_EMAIL:'darkstardevx@gmail.com',SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.health.accountDatabase,true);assert.ok(Array.isArray(data.reports));assert.ok(Array.isArray(data.hiddenContent));
});


test('aggregate telemetry accepts the Template Vault route',async()=>{
 const db=fakeDb(),response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/telemetry',{method:'POST',headers:{Origin:'https://darkwavecode.pages.dev','Content-Type':'application/json'},body:JSON.stringify({event:'page',label:'templates'})}),{AUTH_DB:db,SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.equal(response.status,200);assert.ok(db.writes.some(write=>write.sql.includes('INSERT INTO telemetry_daily')&&write.args.includes('templates')));
});
