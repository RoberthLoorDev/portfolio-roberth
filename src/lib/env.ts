/** Reads a server-side variable from Astro's env first, then from the runtime environment. */
export function getEnv(name: string): string | undefined {
     const fromAstro = (import.meta.env as Record<string, string | undefined>)[name]
     if (fromAstro) return fromAstro
     return typeof process !== 'undefined' ? process.env[name] : undefined
}
