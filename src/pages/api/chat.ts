export const prerender = false

import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
     import.meta.env.PUBLIC_SUPABASE_URL,
     import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
)

const genAI = new GoogleGenerativeAI(import.meta.env.GOOGLE_API_KEY)
const embeddingModel = genAI.getGenerativeModel({
  model: 'gemini-embedding-001',
})
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
          const { data: filteredChunks, error: searchError } = await supabase.rpc(
               'match_portfolio_chunks',
               {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.4,
                    match_count: 10,
               },
          )

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

          // Nota: Eliminamos todo el código de cálculo manual de similitud.

          console.log('📚 Chunks encontrados:', filteredChunks.length)
          console.log(
               '📊 Similitudes:',
               filteredChunks.map((c: any) => c.similarity.toFixed(3)),
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
               - PROHIBIDO usar asteriscos (*), guiones (-) o cualquier formato Markdown
               - PROHIBIDO usar negritas (**texto**)
               - Responde en texto plano, corrido, como en una conversación normal
               - Enumera tecnologías separadas por comas en el mismo párrafo
               - Habla de Roberth en tercera persona

               Ejemplo de RESPUESTA INCORRECTA (NO hacer esto):
               "* Express.js: Para APIs
               * Nest.js: Para servidores"

               CONTEXTO:
               ${context}

               PREGUNTA: ${message}

               RESPUESTA:`

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
