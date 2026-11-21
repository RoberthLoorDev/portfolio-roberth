import { getSecret } from 'astro:env/server'

/** Reads a server-side variable at runtime (declared in the `env.schema` of astro.config.mjs). */
export function getEnv(name: string): string | undefined {
     return getSecret(name)
}
