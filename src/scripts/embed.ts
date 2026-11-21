// Regenerates src/data/embeddings.json from src/data/portfolioData.ts.
//
//   npm run embed          -> embeds only new/changed chunks (needs GOOGLE_API_KEY)
//   npm run embed:check    -> no network; exits 1 if the JSON is out of date
//
import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { portfolioData } from '../data/portfolioData'
import { chunkHash, chunkText, type KnowledgeChunk } from '../lib/chunkText'
import { embedText, EMBEDDING_DIMS, EMBEDDING_MODEL } from '../lib/embedText'

const OUTPUT = fileURLToPath(new URL('../data/embeddings.json', import.meta.url))

interface StoredChunk extends KnowledgeChunk {
     hash: string
     embedding: number[]
}

interface EmbeddingsFile {
     model: string
     dimensions: number
     chunks: StoredChunk[]
}

async function loadExisting(): Promise<Map<string, number[]>> {
     try {
          const file = JSON.parse(await readFile(OUTPUT, 'utf8')) as EmbeddingsFile
          return new Map(file.chunks.map((c) => [c.hash, c.embedding]))
     } catch {
          return new Map()
     }
}

async function main() {
     const checkOnly = process.argv.includes('--check')
     const existing = await loadExisting()

     const stale = portfolioData.filter((chunk) => !existing.has(chunkHash(chunk)))
     const orphans = existing.size - (portfolioData.length - stale.length)

     if (checkOnly) {
          if (stale.length > 0 || orphans > 0) {
               console.error(
                    `❌ embeddings.json is out of date (${stale.length} new/changed, ${orphans} removed). Run: npm run embed`,
               )
               process.exit(1)
          }
          console.log(`✅ embeddings.json is up to date (${portfolioData.length} chunks)`)
          return
     }

     const apiKey = process.env.GOOGLE_API_KEY
     if (stale.length > 0 && !apiKey) {
          console.error('❌ GOOGLE_API_KEY is missing in .env')
          process.exit(1)
     }

     const chunks: StoredChunk[] = []
     for (const chunk of portfolioData) {
          const hash = chunkHash(chunk)
          let embedding = existing.get(hash)

          if (embedding) {
               console.log(`⏭️  unchanged: ${chunk.title}`)
          } else {
               console.log(`🔢 embedding: ${chunk.title}`)
               embedding = await embedText(
                    chunkText(chunk),
                    'RETRIEVAL_DOCUMENT',
                    apiKey!,
               )
          }
          // The text is stored next to its vector so the server only needs this one file
          chunks.push({ hash, ...chunk, embedding })
     }

     const file: EmbeddingsFile = {
          model: EMBEDDING_MODEL,
          dimensions: EMBEDDING_DIMS,
          chunks,
     }
     await writeFile(OUTPUT, JSON.stringify(file) + '\n')
     console.log(`\n🎉 ${chunks.length} chunks saved (${stale.length} re-embedded)`)
}

main().catch((error) => {
     console.error(error)
     process.exit(1)
})
