// Gemini embeddings via REST. Shared by the build-time script (src/scripts/embed.ts)
// and the runtime endpoint (src/pages/api/chat.ts). Must not import JSON or Astro-only APIs.

export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMS = 768

export type EmbedTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'

function normalize(vector: number[]): number[] {
     const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1
     // 6 decimals keeps the JSON small without hurting ranking
     return vector.map((v) => Number((v / norm).toFixed(6)))
}

export async function embedText(
     text: string,
     task: EmbedTask,
     apiKey: string,
): Promise<number[]> {
     const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
          {
               method: 'POST',
               headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
               },
               body: JSON.stringify({
                    content: { parts: [{ text }] },
                    taskType: task,
                    outputDimensionality: EMBEDDING_DIMS,
               }),
          },
     )

     if (!response.ok) {
          throw new Error(
               `Embedding request failed (${response.status}): ${await response.text()}`,
          )
     }

     const data = (await response.json()) as { embedding?: { values?: number[] } }
     const values = data.embedding?.values
     if (!values || values.length !== EMBEDDING_DIMS) {
          throw new Error(
               `Unexpected embedding size: ${values?.length}, expected ${EMBEDDING_DIMS}`,
          )
     }

     // Truncated (non-3072) Gemini embeddings are not normalized, so we do it here.
     return normalize(values)
}
