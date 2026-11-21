export const prerender = false

import type { APIRoute } from 'astro'
import { embedText } from '../../lib/embedText'
import { getEnv } from '../../lib/env'
import { cacheKey, checkRateLimit, getCached, setCached } from '../../lib/guards'
import { withLanguageInstruction } from '../../lib/language'
import { providerOrder, streamAnswer } from '../../lib/llm'
import { search } from '../../lib/retrieval'

const MAX_QUESTION_LENGTH = 500
const TOP_K = 5

const json = (body: unknown, status: number) =>
     new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
     })

function buildSystemPrompt(context: string) {
     return `Eres el asistente del portfolio de Roberth Loor, desarrollador Frontend/Full-Stack.

REGLAS:
- Responde SOLO con la información del CONTEXTO. Si no aparece, di brevemente que no tienes ese dato.
- Sé preciso y no exageres: no inventes cargos, cifras ni fechas, y no conviertas mentoría o decisiones técnicas en dirección de personas. Cuando el CONTEXTO aclare un límite (por ejemplo, que el liderazgo es técnico), inclúyelo.
- Si la pregunta no tiene que ver con Roberth, su experiencia, proyectos o habilidades, indica amablemente que solo puedes hablar de eso.
- LANGUAGE (highest priority): always reply in the language of the user's QUESTION. If the question is in English, your whole answer MUST be in English even though the CONTEXT is in Spanish (translate it). If the question is in Spanish, reply in Spanish.
- Texto plano y corrido, como en una conversación. PROHIBIDO usar Markdown, asteriscos, guiones de lista o negritas.
- Enumera tecnologías separadas por comas dentro del mismo párrafo.
- Habla de Roberth en tercera persona. Sé conciso (máximo 5 frases).

CONTEXTO:
${context}`
}

const ndjson = (event: Record<string, unknown>) => JSON.stringify(event) + '\n'

/**
 * Client IP for rate limiting. `Astro.clientAddress` throws on the Vercel adapter, so use the
 * headers Vercel sets (it overwrites them, so clients cannot spoof them). Falls back to
 * `clientAddress` in local dev, and to one shared bucket if nothing is available.
 */
function getClientIp(context: Parameters<APIRoute>[0]): string {
     const headers = context.request.headers
     const fromHeaders =
          headers.get('x-vercel-forwarded-for') ??
          headers.get('x-real-ip') ??
          headers.get('x-forwarded-for')?.split(',')[0]
     if (fromHeaders?.trim()) return fromHeaders.trim()
     try {
          return context.clientAddress
     } catch {
          return 'unknown'
     }
}

export const POST: APIRoute = async (context) => {
     const { request } = context
     let question: string
     try {
          const body = await request.json()
          question = typeof body?.message === 'string' ? body.message.trim() : ''
     } catch {
          return json({ error: 'Solicitud inválida' }, 400)
     }

     if (!question || question.length > MAX_QUESTION_LENGTH) {
          return json(
               {
                    error: `Escribe una pregunta de hasta ${MAX_QUESTION_LENGTH} caracteres`,
               },
               400,
          )
     }

     const limit = checkRateLimit(getClientIp(context))
     if (!limit.allowed) {
          const wait =
               limit.retryAfterSeconds >= 90
                    ? `${Math.ceil(limit.retryAfterSeconds / 60)} minutos`
                    : `${limit.retryAfterSeconds} segundos`
          const error =
               limit.scope === 'global'
                    ? `El chat está recibiendo muchas consultas ahora mismo. Intenta de nuevo en ${wait}.`
                    : `Has hecho muchas preguntas seguidas. Intenta de nuevo en ${wait}.`
          return new Response(JSON.stringify({ error }), {
               status: 429,
               headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(limit.retryAfterSeconds),
               },
          })
     }

     const providers = providerOrder()
     if (providers.length === 0) {
          console.error('No LLM provider configured (GOOGLE_API_KEY / GROQ_API_KEY)')
          return json({ error: 'El chat no está disponible en este momento' }, 503)
     }

     const headers = {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Accel-Buffering': 'no',
     }

     // Repeated question: replay the stored answer without calling any API
     const key = cacheKey(question, providers[0])
     const cached = getCached(key)
     if (cached) {
          return new Response(
               ndjson({ type: 'sources', sources: cached.sources }) +
                    ndjson({ type: 'token', text: cached.text }) +
                    ndjson({ type: 'done', cached: true }),
               { headers },
          )
     }

     let retrieved
     try {
          const queryEmbedding = await embedText(
               question,
               'RETRIEVAL_QUERY',
               getEnv('GOOGLE_API_KEY')!,
          )
          retrieved = search(queryEmbedding, TOP_K)
     } catch (error) {
          console.error('Embedding error:', error)
          return json({ error: 'No pude procesar tu pregunta. Intenta de nuevo.' }, 502)
     }

     const sources = retrieved.map(({ title, category, score }) => ({
          title,
          category,
          similarity: (score * 100).toFixed(1) + '%',
     }))
     const system = buildSystemPrompt(
          retrieved
               .map(({ title, content }) => `[${title}]\n${content}`)
               .join('\n\n---\n\n'),
     )

     const stream = new ReadableStream({
          async start(controller) {
               const encoder = new TextEncoder()
               const send = (event: Record<string, unknown>) =>
                    controller.enqueue(encoder.encode(ndjson(event)))

               send({ type: 'sources', sources })

               let fullText = ''
               let succeeded = false

               for (const provider of providers) {
                    try {
                         for await (const text of streamAnswer(provider, {
                              system,
                              question: withLanguageInstruction(question),
                         })) {
                              fullText += text
                              send({ type: 'token', text })
                         }
                         succeeded = true
                         break
                    } catch (error) {
                         console.error(`LLM error (${provider}):`, error)
                         // Only fall back if nothing reached the user yet
                         if (fullText) break
                    }
               }

               if (succeeded && fullText) {
                    setCached(key, { text: fullText, sources })
                    send({ type: 'done' })
               } else {
                    send({
                         type: 'error',
                         message: fullText
                              ? 'La respuesta se interrumpió. Intenta de nuevo.'
                              : 'No pude generar una respuesta ahora mismo. Intenta de nuevo en un momento.',
                    })
               }
               controller.close()
          },
     })

     return new Response(stream, { headers })
}
