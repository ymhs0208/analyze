interface Env {
  SUPABASE_URL?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const functionPaths = new Set([
  '/functions/v1/backend',
  '/functions/v1/line-login',
  '/functions/v1/ecpay-callback',
]);
const sessionCookies = new Set(['__Secure-line_membership_session_v2', 'support_payment_status']);

function errorResponse(message: string, status: number) {
  return Response.json({ error: message, message }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/functions/')) return env.ASSETS.fetch(request);
    if (!functionPaths.has(url.pathname)) return errorResponse('API_NOT_FOUND', 404);

    // A fixed Supabase origin prevents this endpoint from becoming an open proxy.
    let upstream: URL;
    try {
      upstream = new URL(env.SUPABASE_URL || '');
      if (upstream.protocol !== 'https:' ||
          !/^[a-z0-9-]+\.supabase\.co$/.test(upstream.hostname) ||
          upstream.port || upstream.username || upstream.password ||
          upstream.pathname !== '/' || upstream.search || upstream.hash) {
        throw new Error('Invalid upstream');
      }
    } catch {
      return errorResponse('API_PROXY_NOT_CONFIGURED', 503);
    }
    upstream.pathname = url.pathname;
    upstream.search = url.search;

    const headers = new Headers(request.headers);
    headers.delete('host');
    // Preserve the browser Origin so Supabase still enforces its own allowlist.
    // Only application cookies should leave this website for Supabase.
    const cookies = (headers.get('cookie') || '').split(';')
      .map((cookie) => cookie.trim())
      .filter((cookie) => sessionCookies.has(cookie.split('=', 1)[0]));
    headers.delete('cookie');
    if (cookies.length) headers.set('cookie', cookies.join('; '));

    try {
      const response = await fetch(new Request(upstream, new Request(request, {
        headers,
        redirect: 'manual',
        cache: 'no-store',
      })));
      const result = new Response(response.body, response);
      // Keep Set-Cookie, Location, status and body intact. In particular, LINE
      // redirects must reach the browser instead of being followed by the proxy.
      result.headers.set('Cache-Control', 'no-store');
      result.headers.set('X-Content-Type-Options', 'nosniff');
      return result;
    } catch {
      return errorResponse('API_UPSTREAM_UNAVAILABLE', 502);
    }
  },
};
