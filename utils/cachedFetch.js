// utils/cachedFetch.js
const cache = new Map();

export function peekCache(key) {
  return cache.get(key)?.v;
}

export function setCache(key, value) {
  cache.set(key, { v: value, t: Date.now() });
}

export function invalidateCache(prefix = '') {
  for (const k of Array.from(cache.keys())) {
    if (!prefix || String(k).startsWith(prefix)) cache.delete(k);
  }
}

/**
 * cachedFetch('profile', () => ApiService.getProfile(), 60_000)
 */
export async function cachedFetch(key, fetcher, ttlMs = 30_000) {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.t < ttlMs) return hit.v; // fresh

  const value = await fetcher();
  setCache(key, value);
  return value;
}