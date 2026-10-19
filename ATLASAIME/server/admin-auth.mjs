import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const COOKIE = '__Host-atlas_admin';
export const TTL = 8 * 60 * 60;
export function configuration(env = process.env) {
  const password = env.ATLAS_ADMIN_PASSWORD;
  const secret = env.ATLAS_SESSION_SECRET;
  // Fail closed without strong, explicitly configured server-side secrets.
  return password?.length >= 24 && secret?.length >= 32 ? { password, secret } : null;
}
const hash = value => createHash('sha256').update(value).digest();
export function passwordMatches(candidate, config) {
  return typeof candidate === 'string' && candidate.length <= 1024 && timingSafeEqual(hash(candidate), hash(config.password));
}
const sign = (body, config) => createHmac('sha256', config.secret).update(hash(config.password)).update(body).digest('base64url');
export function createSession(config, now = Date.now()) {
  const body = `${Math.floor(now / 1000) + TTL}.${randomBytes(24).toString('base64url')}`;
  return `${body}.${sign(body, config)}`;
}
export function authenticated(cookie, config, now = Date.now()) {
  if (!config || typeof cookie !== 'string' || cookie.length > 8192) return false;
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || !/^\d+\.[A-Za-z0-9_-]{32}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [expiry, nonce, signature] = token.split('.');
  const timestamp = Math.floor(now / 1000);
  if (+expiry <= timestamp || +expiry > timestamp + TTL) return false;
  const expected = sign(`${expiry}.${nonce}`, config);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
export function sessionCookie(token = '') {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${token ? TTL : 0}`;
}
