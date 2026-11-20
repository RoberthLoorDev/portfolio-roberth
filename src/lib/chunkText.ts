import { createHash } from 'node:crypto'
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from './embedText'

export interface PortfolioChunk {
     category: string
     content: string
     metadata: { title: string; [key: string]: unknown }
}

/** Text that actually gets embedded for a chunk. */
export function chunkText(chunk: PortfolioChunk): string {
     return `Roberth Loor – ${chunk.metadata.title}\n\n${chunk.content}`
}

/** Stable id: changes whenever the text, model or dimensions change. */
export function chunkHash(chunk: PortfolioChunk): string {
     return createHash('sha256')
          .update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMS}:${chunkText(chunk)}`)
          .digest('hex')
          .slice(0, 16)
}
