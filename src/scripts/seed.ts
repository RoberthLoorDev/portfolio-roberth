import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
     process.env.PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const genIA = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const embeddingModel = genIA.getGenerativeModel({
     model: 'text-embedding-004',
})
import { portfolioData } from './portfolioData'

// principal function to seed the database
async function seedPortfolio() {
     console.log('🚀 Starting generation embeddings... \n')
     let processCount = 0

     // Iterate over each portfolio item
     for (const chunk of portfolioData) {
          try {
               console.log(`🔍 Processing chunk: "${chunk.metadata.title}..."`)

               const textToEmbed = `Roberth Loor – ${chunk.metadata.title}\n\n${chunk.content}`
               const result = await embeddingModel.embedContent(textToEmbed)
               const embedding = result.embedding.values

               if (embedding.length !== 768) {
                    throw new Error(
                         `Embedding length is ${embedding.length}, expected 768.`,
                    )
               }

               const { data, error } = await supabase.from('portfolio_chunks').insert({
                    content: chunk.content,
                    category: chunk.category,
                    metadata: chunk.metadata,
                    embedding: embedding,
               })

               if (error) {
                    console.error(
                         `❌ Supabase error for chunk: "${chunk.metadata.title}, error: ${error.message}"`,
                    )
               }

               processCount++
               console.log(`✅ Save completed for chunk: "${chunk.metadata.title}"\n`)

               // Avoid rate limits
               await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (error) {
               console.error(
                    `❌ Error processing chunk: "${chunk.metadata.title}"`,
                    error,
               )
          }
     }

     console.log(`\n 🎉 Processed ${processCount} chunks successfully.`)
}

seedPortfolio()
