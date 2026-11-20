// Best-effort, in-memory protections. On serverless, state lives per warm instance,
// so these limit casual abuse and repeat questions but are not a hard guarantee.

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 8
const hits = new Map<string, number[]>()

/** Returns true if this IP may make a request right now. */
export function allowRequest(ip: string): boolean {
     const now = Date.now()
     const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)

     if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
          hits.set(ip, recent)
          return false
     }

     recent.push(now)
     hits.set(ip, recent)

     // Keep the map from growing forever
     if (hits.size > 5_000) {
          for (const [key, times] of hits) {
               if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
          }
     }
     return true
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
