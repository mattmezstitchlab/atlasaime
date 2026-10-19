import { readFile } from 'node:fs/promises';
import { authenticated, configuration, createSession, passwordMatches, sessionCookie } from '../server/admin-auth.mjs';

const attempts = new Map();
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
function page(message = '', status = 200) {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Administration — ATLAS</title></head><body style="font-family:system-ui;background:#f5f5f2;max-width:420px;margin:15vh auto;padding:24px"><h1>Administration</h1><p>Accès réservé au propriétaire.</p><p role="alert">${message}</p><form method="post" action="/admin"><label>Mot de passe<input type="password" name="password" required maxlength="1024" autocomplete="current-password" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:15px 0"></label><button type="submit">Se connecter</button></form><p><a href="/">Retour au portfolio</a></p></body></html>`, { status, headers: { ...headers, 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } });
}
export function createAdminHandler({ env = process.env, readAdmin = () => readFile(`${process.cwd()}/.admin-build/admin.html`, 'utf8'), delay = () => new Promise(r => setTimeout(r, 600)) } = {}) {
  return async function handle(request) {
    const config = configuration(env);
    if (!config) return page('Accès fermé : les secrets administrateur doivent être configurés sur le serveur.', 503);
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== new URL(request.url).origin) return page('Origine refusée.', 403);
      if (Number(request.headers.get('content-length') || 0) > 4096) return page('Requête trop volumineuse.', 413);
      let body; try { const raw = await request.text(); if (raw.length > 4096) return page('Requête trop volumineuse.',413); body = new URLSearchParams(raw); } catch { return page('Requête invalide.',400); }
      if (body.get('action') === 'logout') return new Response(null, {status:303,headers:{...headers,Location:'/admin','Set-Cookie':sessionCookie()}});
      // Best-effort instance-local limiter, not a substitute for a distributed WAF rule.
      const key = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now(); const previous = attempts.get(key); const attempt = previous && previous.until > now ? previous : { count:0, until: now + 15*60*1000 };
      attempt.count++; if (attempts.size > 1000) attempts.clear(); attempts.set(key,attempt);
      if (attempt.count > 5) return page('Trop de tentatives. Réessayez dans quinze minutes.',429);
      await delay();
      if (!passwordMatches(body.get('password'),config)) return page('Connexion refusée.',401);
      attempts.delete(key);
      return new Response(null,{status:303,headers:{...headers,Location:'/admin','Set-Cookie':sessionCookie(createSession(config))}});
    }
    if (request.method !== 'GET') return new Response(null,{status:405,headers:{...headers,Allow:'GET, POST'}});
    if (!authenticated(request.headers.get('cookie'),config)) return page();
    try { return new Response(await readAdmin(), {headers}); } catch { return page('L’atelier est temporairement indisponible.',503); }
  };
}
export default { fetch: createAdminHandler() };
