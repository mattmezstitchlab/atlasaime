import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration, passwordMatches, createSession, authenticated, sessionCookie, TTL } from '../server/admin-auth.mjs';
import { createAdminHandler } from '../api/admin.js';
import { randomBytes } from 'node:crypto';
const env = { ATLAS_ADMIN_PASSWORD: randomBytes(24).toString('hex'), ATLAS_SESSION_SECRET: randomBytes(32).toString('hex') };
const config = configuration(env);
const url = 'https://example.test/admin';
const post = (body, origin = 'https://example.test') => new Request(url, {method:'POST',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
test('Secrets absent or too short close access, never use a default password', async () => {
  assert.equal(configuration({}),null);
  assert.equal(configuration({ATLAS_ADMIN_PASSWORD:'short',ATLAS_SESSION_SECRET:'short'}),null);
  let read = false;
  const res = await createAdminHandler({env:{},readAdmin:async()=>{read=true;return 'PRIVATE'}})(new Request(url));
  assert.equal(res.status,503);assert.equal(read,false);
});
test('Sessions reject tampering, expiry and rotated password/secret', () => {
  assert.equal(passwordMatches(env.ATLAS_ADMIN_PASSWORD,config),true);
  assert.equal(passwordMatches('incorrect',config),false);
  const now = Date.now();const token = createSession(config,now);const cookie = sessionCookie(token);
  assert.equal(authenticated(cookie,config,now),true);
  assert.equal(authenticated(cookie,config,now+(TTL+1)*1000),false);
  assert.equal(authenticated(cookie.replace(token,token+'x'),config,now),false);
  assert.equal(authenticated(cookie,{...config,password:randomBytes(24).toString('hex')},now),false);
  assert.equal(authenticated(cookie,{...config,secret:randomBytes(32).toString('hex')},now),false);
  for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/']) assert.ok(cookie.includes(flag));
});
test('Server gates workshop HTML, origin-checks login and clears cookie on logout', async () => {
  let reads=0;
  const handler=createAdminHandler({env,delay:async()=>{},readAdmin:async()=>{reads++;return '<html>PRIVATE WORKSHOP</html>';}});
  const anonymous=await handler(new Request(url));assert.equal(reads,0);assert.doesNotMatch(await anonymous.text(),/PRIVATE WORKSHOP/);
  assert.equal((await handler(post({password:env.ATLAS_ADMIN_PASSWORD},'https://evil.test'))).status,403);
  assert.equal((await handler(post({password:'wrong'}))).status,401);
  const login=await handler(post({password:env.ATLAS_ADMIN_PASSWORD}));assert.equal(login.status,303);
  const cookie=login.headers.get('set-cookie');assert.ok(cookie);
  const res=await handler(new Request(url,{headers:{cookie}}));assert.match(await res.text(),/PRIVATE WORKSHOP/);assert.equal(reads,1);assert.match(res.headers.get('cache-control'),/no-store/);
  const logout=await handler(post({action:'logout'}));assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
  assert.equal((await handler(new Request(url,{method:'PUT'}))).status,405);
});
test('Repeated failures hit instance limiter and oversized submissions are refused',async()=>{
  const handler=createAdminHandler({env,delay:async()=>{}});
  for(let i=0;i<5;i++) assert.equal((await handler(post({password:'wrong'}))).status,401);
  assert.equal((await handler(post({password:'wrong'}))).status,429);
  assert.equal((await handler(post({password:'x'.repeat(5000)}))).status,413);
});

test('Authenticated workshop never loads from an anonymous direct API request',async()=>{
  const handler=createAdminHandler({env,readAdmin:async()=>{throw new Error('Private file must not be touched');}});
  for(const path of ['/admin','/admin/deep/path','/api/admin']) {
    const res=await handler(new Request(`https://example.test${path}`));
    assert.equal(res.status,200);
    assert.match(await res.text(),/type="password"/);
    assert.match(res.headers.get('vercel-cdn-cache-control'),/no-store/);
  }
});
