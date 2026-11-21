import { createHash } from 'node:crypto'
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from './embedText'

/** One searchable piece of knowledge the chat can quote. */
export interface KnowledgeChunk {
     category: string
     title: string
     content: string
}

/** Text that actually gets embedded for a chunk. */
export function chunkText(chunk: KnowledgeChunk): string {
     return `Roberth Loor – ${chunk.title}\n\n${chunk.content}`
}

/** Stable id: changes whenever the text, model or dimensions change. */
export function chunkHash(chunk: KnowledgeChunk): string {
     return createHash('sha256')
          .update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMS}:${chunkText(chunk)}`)
          .digest('hex')
          .slice(0, 16)
}
