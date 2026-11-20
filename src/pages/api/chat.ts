export const prerender = false

import type { APIRoute } from 'astro'
import { embedText } from '../../lib/embedText'
import { getEnv } from '../../lib/env'
import { allowRequest, cacheKey, getCached, setCached } from '../../lib/guards'
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
- Si la pregunta no tiene que ver con Roberth, su experiencia, proyectos o habilidades, indica amablemente que solo puedes hablar de eso.
- IDIOMA: responde siempre en el idioma en que está escrita la PREGUNTA (inglés o español), aunque el CONTEXTO esté en español. Traduce lo necesario.
- Texto plano y corrido, como en una conversación. PROHIBIDO usar Markdown, asteriscos, guiones de lista o negritas.
- Enumera tecnologías separadas por comas dentro del mismo párrafo.
- Habla de Roberth en tercera persona. Sé conciso (máximo 5 frases).

CONTEXTO:
${context}`
}

const ndjson = (event: Record<string, unknown>) => JSON.stringify(event) + '\n'

export const POST: APIRoute = async ({ request, clientAddress }) => {
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

     let ip = 'unknown'
     try {
          ip = clientAddress
     } catch {
          // clientAddress is unavailable in some environments
     }
     if (!allowRequest(ip)) {
          return json(
               { error: 'Demasiadas preguntas seguidas. Intenta de nuevo en un minuto.' },
               429,
          )
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

     const sources = retrieved.map(({ chunk, score }) => ({
          title: chunk.metadata.title,
          category: chunk.category,
          similarity: (score * 100).toFixed(1) + '%',
     }))
     const system = buildSystemPrompt(
          retrieved
               .map(({ chunk }) => `[${chunk.metadata.title}]\n${chunk.content}`)
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
                              question,
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
