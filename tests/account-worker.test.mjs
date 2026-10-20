import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../_worker.js',import.meta.url),'utf8');
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function fakeDb(){
 const writes=[];
 return {writes,prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){if(sql.startsWith('SELECT count,window_started'))return null;return null},async run(){writes.push({sql,args});return {success:true}},async all(){return {results:[]}}}},async batch(items){for(const item of items)await item.run()}};
}

test('static assets pass through the Pages asset binding',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/profile.html'),{ASSETS:{fetch:async()=>new Response('profile asset')}});
 assert.equal(response.status,200);assert.equal(await response.text(),'profile asset');
});

test('account status reports provider readiness without exposing identity data',async()=>{
 const response=await worker.fetch(new Request('https://darkwavecode.pages.dev/api/auth/status'),{AUTH_DB:fakeDb(),SITE_ORIGIN:'https://darkwavecode.pages.dev'});
 assert.deepEqual(await response.json(),{ready:false,emailReady:false,user:null});
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
