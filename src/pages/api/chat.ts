export const prerender = false

import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
     import.meta.env.PUBLIC_SUPABASE_URL,
     import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
)

const genAI = new GoogleGenerativeAI(import.meta.env.GOOGLE_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export const POST: APIRoute = async ({ request }) => {
     try {
          console.log('📥 Request recibido')

          const body = await request.json()
          const { message } = body

          console.log('💬 Mensaje:', message)

          if (!message || typeof message !== 'string' || message.trim().length === 0) {
               return new Response(JSON.stringify({ error: 'Mensaje requerido' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
               })
          }

          // Generate embedding from user message
          console.log('🔢 Generando embedding...')
          const queryEmbeddingResult = await embeddingModel.embedContent(message)
          const queryEmbedding = queryEmbeddingResult.embedding.values

          console.log('🔢 Embedding generado, dimensiones:', queryEmbedding.length)

          // Get all chunks from database
          console.log('🔍 Buscando chunks con raw SQL...')

          const embeddingStr = '[' + queryEmbedding.join(',') + ']'

          const { data: relevantChunks, error: searchError } = await supabase
               .from('portfolio_chunks')
               .select('*')
               .limit(100)

          if (searchError) {
               console.error('❌ Error obteniendo chunks:', searchError)
               return new Response(
                    JSON.stringify({
                         error: 'Error en búsqueda',
                         details: searchError.message,
                    }),
                    {
                         status: 500,
                         headers: { 'Content-Type': 'application/json' },
                    },
               )
          }

          // Calculate cosine similarity for each chunk
          const chunksWithSimilarity = relevantChunks.map((chunk: any) => {
               const chunkEmbedding =
                    typeof chunk.embedding === 'string'
                         ? JSON.parse(chunk.embedding)
                         : chunk.embedding

               let dotProduct = 0
               let normA = 0
               let normB = 0

               for (let i = 0; i < 768; i++) {
                    dotProduct += queryEmbedding[i] * chunkEmbedding[i]
                    normA += queryEmbedding[i] * queryEmbedding[i]
                    normB += chunkEmbedding[i] * chunkEmbedding[i]
               }

               const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))

               return {
                    ...chunk,
                    similarity,
               }
          })

          // Filter and sort by similarity
          const filteredChunks = chunksWithSimilarity
               .filter((chunk) => chunk.similarity > 0.5)
               .sort((a, b) => b.similarity - a.similarity)
               .slice(0, 5)

          console.log('📚 Chunks encontrados:', filteredChunks.length)
          console.log(
               '📊 Similitudes:',
               filteredChunks.map((c) => c.similarity.toFixed(3)),
          )

          if (filteredChunks.length === 0) {
               return new Response(
                    JSON.stringify({
                         response:
                              'No encontré información relevante. ¿Puedes reformular tu pregunta?',
                         sources: [],
                    }),
                    {
                         status: 200,
                         headers: { 'Content-Type': 'application/json' },
                    },
               )
          }

          // Build context from relevant chunks
          const context = filteredChunks
               .map((chunk: any) => `[${chunk.metadata.title}]\n${chunk.content}`)
               .join('\n\n---\n\n')

          console.log('🤖 Generando respuesta...')
          const prompt = `Eres un asistente del portfolio de Roberth Loor, desarrollador Frontend/Full-Stack.

               REGLAS ESTRICTAS:
               - PROHIBIDO usar asteriscos (*), guiones (-), números (1. 2. 3.), o cualquier formato Markdown
               - PROHIBIDO usar negritas (**texto**)
               - PROHIBIDO hacer listas verticales
               - Responde en texto plano, corrido, como en una conversación normal
               - Sé BREVE y DIRECTO, máximo 2-3 oraciones
               - Enumera tecnologías separadas por comas en el mismo párrafo
               - Basate ÚNICAMENTE en el contexto proporcionado

               Ejemplo de RESPUESTA CORRECTA:
               "En backend trabajo con Express.js y Nest.js para APIs y servidores Node.js, Supabase para autenticación, MySQL, PostgreSQL y MongoDB para bases de datos."

               Ejemplo de RESPUESTA INCORRECTA (NO hacer esto):
               "* Express.js: Para APIs
               * Nest.js: Para servidores"

               CONTEXTO:
               ${context}

               PREGUNTA: ${message}

               RESPUESTA (texto plano sin asteriscos ni formato):`

          const result = await chatModel.generateContent(prompt)
          const response = result.response.text()

          console.log('✅ Respuesta generada')

          return new Response(
               JSON.stringify({
                    response,
                    sources: filteredChunks.map((chunk: any) => ({
                         title: chunk.metadata.title,
                         category: chunk.category,
                         similarity: (chunk.similarity * 100).toFixed(1) + '%',
                    })),
               }),
               {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
               },
          )
     } catch (error) {
          console.error('❌ Error:', error)
          return new Response(
               JSON.stringify({
                    error: 'Error interno',
                    message: error instanceof Error ? error.message : 'Unknown',
               }),
               {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
               },
          )
     }
}
