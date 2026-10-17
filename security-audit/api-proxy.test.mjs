import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker/index.ts';

const origin = 'https://analyze.twexam.cc.cd';
const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  ASSETS: { fetch: async () => new Response('site asset') },
};

test('proxy preserves POST body, query, browser Origin and application cookies', async (t) => {
  const body = JSON.stringify({ action: 'getMembership' });
  const cookie = '__Secure-line_membership_session_v2=session; support_payment_status=payment';
  const setCookie = '__Secure-line_membership_session_v2=new; HttpOnly; Secure; SameSite=None; Partitioned; Path=/functions/v1/backend';
  t.mock.method(globalThis, 'fetch', async (request) => {
    assert.equal(request.url, 'https://project.supabase.co/functions/v1/backend?_v=2');
    assert.equal(request.method, 'POST');
    assert.equal(await request.text(), body);
    assert.equal(request.headers.get('origin'), origin);
    assert.equal(request.headers.get('cookie'), cookie);
    assert.equal(request.headers.get('apikey'), 'public-anon-key');
    assert.equal(request.cache, 'no-store');
    assert.equal(request.redirect, 'manual');
    return new Response('{"ok":true}', { headers: { 'Set-Cookie': setCookie } });
  });
  const response = await worker.fetch(new Request(`${origin}/functions/v1/backend?_v=2`, {
    method: 'POST', body,
    headers: { Origin: origin, Cookie: `${cookie}; unrelated_site_cookie=private`, apikey: 'public-anon-key' },
  }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), setCookie);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(await response.text(), '{"ok":true}');
});

test('LINE redirect is returned to the browser without following it', async (t) => {
  t.mock.method(globalThis, 'fetch', async (request) => {
    assert.equal(request.redirect, 'manual');
    assert.equal(request.headers.get('origin'), null);
    return new Response(null, { status: 302, headers: { Location: 'https://access.line.me/oauth2/v2.1/authorize?state=opaque' } });
  });
  const response = await worker.fetch(new Request(`${origin}/functions/v1/line-login?browserChallenge=challenge`), env);
  assert.equal(response.status, 302);
  assert.match(response.headers.get('location'), /^https:\/\/access.line.me\//);
});

test('foreign Origins are preserved; missing Origins are not synthesized', async (t) => {
  for (const value of ['https://foreign.example', null]) {
    t.mock.method(globalThis, 'fetch', async (request) => {
      assert.equal(request.headers.get('origin'), value);
      return new Response('denied', { status: 403 });
    });
    const response = await worker.fetch(new Request(`${origin}/functions/v1/backend`, {
      method: 'POST', headers: value ? { Origin: value } : {},
    }), env);
    assert.equal(response.status, 403);
    t.mock.restoreAll();
  }
});

test('static routes use assets; unknown functions cannot reach the upstream', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('must not fetch'); });
  assert.equal(await (await worker.fetch(new Request(`${origin}/membership`), env)).text(), 'site asset');
  assert.equal((await worker.fetch(new Request(`${origin}/functions/v1/private-function`), env)).status, 404);
  assert.equal(mock.mock.callCount(), 0);
});

test('missing or unsafe upstream configuration fails closed', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', () => { throw new Error('must not fetch'); });
  for (const SUPABASE_URL of [undefined, 'http://project.supabase.co', 'https://evil.example', 'https://project.supabase.co.evil.example', 'https://user:password@project.supabase.co', 'https://project.supabase.co/path']) {
    const response = await worker.fetch(new Request(`${origin}/functions/v1/backend`), { ...env, SUPABASE_URL });
    assert.equal(response.status, 503);
  }
  assert.equal(mock.mock.callCount(), 0);
});

test('upstream network errors return an uncached error without leaking details', async (t) => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('internal secret'); });
  const response = await worker.fetch(new Request(`${origin}/functions/v1/backend`), env);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(await response.text(), /internal secret/);
});
