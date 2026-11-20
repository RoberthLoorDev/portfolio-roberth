import embeddingsFile from '../data/embeddings.json'
import { portfolioData } from '../data/portfolioData'
import { chunkHash, type PortfolioChunk } from './chunkText'

interface IndexedChunk {
     chunk: PortfolioChunk
     embedding: number[]
}

const embeddingByHash = new Map(
     embeddingsFile.chunks.map((c) => [c.hash, c.embedding as number[]]),
)

// Built once per server instance. Chunks without a matching vector (stale JSON)
// are skipped; `npm run build` fails in that case via `embed:check`.
const index: IndexedChunk[] = portfolioData.flatMap((chunk) => {
     const embedding = embeddingByHash.get(chunkHash(chunk))
     return embedding ? [{ chunk, embedding }] : []
})

export interface RetrievedChunk {
     chunk: PortfolioChunk
     score: number
}

/** Vectors are normalized, so the dot product equals cosine similarity. */
export function search(queryEmbedding: number[], topK = 5): RetrievedChunk[] {
     return index
          .map(({ chunk, embedding }) => {
               let score = 0
               for (let i = 0; i < embedding.length; i++) {
                    score += embedding[i] * queryEmbedding[i]
               }
               return { chunk, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, topK)
}
