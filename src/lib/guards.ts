// Best-effort, in-memory protections. On serverless, state lives per warm instance,
// so these limit casual abuse and repeat questions but are not a hard guarantee.

const MINUTE = 60_000
const HOUR = 60 * MINUTE

// A recruiter asks a handful of questions per visit; these limits leave plenty of room
// for that while stopping scripts. Groq's free tier allows 30 requests/min for the whole
// account, so the global cap stays below it.
const LIMITS = {
     perIpPerMinute: 8,
     perIpPerHour: 30,
     globalPerMinute: 25,
}

const ipHits = new Map<string, number[]>()
let globalHits: number[] = []

export type RateLimitResult =
     | { allowed: true }
     | { allowed: false; retryAfterSeconds: number; scope: 'ip' | 'global' }

const within = (times: number[], now: number, windowMs: number) =>
     times.filter((t) => now - t < windowMs)

/** Seconds until the oldest hit in `times` leaves the window. */
const retryAfter = (times: number[], now: number, windowMs: number) =>
     Math.max(1, Math.ceil((times[0] + windowMs - now) / 1000))

export function checkRateLimit(ip: string): RateLimitResult {
     const now = Date.now()

     globalHits = within(globalHits, now, MINUTE)
     const lastHour = within(ipHits.get(ip) ?? [], now, HOUR)
     const lastMinute = within(lastHour, now, MINUTE)
     ipHits.set(ip, lastHour)

     if (lastMinute.length >= LIMITS.perIpPerMinute) {
          return {
               allowed: false,
               scope: 'ip',
               retryAfterSeconds: retryAfter(lastMinute, now, MINUTE),
          }
     }
     if (lastHour.length >= LIMITS.perIpPerHour) {
          return {
               allowed: false,
               scope: 'ip',
               retryAfterSeconds: retryAfter(lastHour, now, HOUR),
          }
     }
     if (globalHits.length >= LIMITS.globalPerMinute) {
          return {
               allowed: false,
               scope: 'global',
               retryAfterSeconds: retryAfter(globalHits, now, MINUTE),
          }
     }

     lastHour.push(now)
     globalHits.push(now)

     // Keep the map from growing forever
     if (ipHits.size > 5_000) {
          for (const [key, times] of ipHits) {
               if (times.every((t) => now - t >= HOUR)) ipHits.delete(key)
          }
     }
     return { allowed: true }
}

// ---- Answer cache: identical questions are replayed instantly ----

export interface CachedAnswer {
     text: string
     sources: { title: string; category: string; similarity: string }[]
}

const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 100
const cache = new Map<string, CachedAnswer & { expires: number }>()

export function cacheKey(question: string, provider: string): string {
     return `${provider}:${question
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[¿?¡!.,]/g, '')
          .trim()}`
}

export function getCached(key: string): CachedAnswer | undefined {
     const entry = cache.get(key)
     if (!entry) return undefined
     if (entry.expires < Date.now()) {
          cache.delete(key)
          return undefined
     }
     return entry
}

export function setCached(key: string, answer: CachedAnswer): void {
     if (cache.size >= CACHE_MAX_ENTRIES) {
          const oldest = cache.keys().next().value
          if (oldest) cache.delete(oldest)
     }
     cache.set(key, { ...answer, expires: Date.now() + CACHE_TTL_MS })
}
