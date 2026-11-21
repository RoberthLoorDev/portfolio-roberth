import { defineConfig, envField } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'

// Server-only variables. Read them at runtime with getSecret() from 'astro:env/server'.
const serverSecret = () =>
     envField.string({ context: 'server', access: 'secret', optional: true })

// https://astro.build/config
export default defineConfig({
     integrations: [react()],
     adapter: vercel(),
     // Keep the same whitespace behavior as Astro 4-6 (v7 defaults to JSX-style stripping)
     compressHTML: true,
     env: {
          schema: {
               GOOGLE_API_KEY: serverSecret(),
               GROQ_API_KEY: serverSecret(),
               BREVO_API_KEY: serverSecret(),
               RECIPIENT_EMAIL: serverSecret(),
               LLM_PROVIDER: serverSecret(),
               GROQ_MODEL: serverSecret(),
               GEMINI_CHAT_MODEL: serverSecret(),
          },
     },
})
