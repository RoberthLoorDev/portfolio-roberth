import { GoogleGenerativeAI } from '@google/generative-ai'
import { getEnv } from './env'

export type Provider = 'gemini' | 'groq'

export interface AnswerRequest {
     system: string
     question: string
}

const GENERATION = { temperature: 0.3, maxTokens: 600 }

export function isConfigured(provider: Provider): boolean {
     return provider === 'groq'
          ? Boolean(getEnv('GROQ_API_KEY'))
          : Boolean(getEnv('GOOGLE_API_KEY'))
}

/** Primary provider first (LLM_PROVIDER, default groq), then the other one as fallback. */
export function providerOrder(): Provider[] {
     const primary: Provider = getEnv('LLM_PROVIDER') === 'gemini' ? 'gemini' : 'groq'
     const secondary: Provider = primary === 'groq' ? 'gemini' : 'groq'
     return [primary, secondary].filter(isConfigured)
}

export function streamAnswer(
     provider: Provider,
     req: AnswerRequest,
): AsyncGenerator<string> {
     return provider === 'groq' ? streamGroq(req) : streamGemini(req)
}

async function* streamGemini({
     system,
     question,
}: AnswerRequest): AsyncGenerator<string> {
     const genAI = new GoogleGenerativeAI(getEnv('GOOGLE_API_KEY')!)
     const model = genAI.getGenerativeModel({
          model: getEnv('GEMINI_CHAT_MODEL') ?? 'gemini-2.5-flash-lite',
          systemInstruction: system,
          generationConfig: {
               temperature: GENERATION.temperature,
               maxOutputTokens: GENERATION.maxTokens,
          },
     })

     const result = await model.generateContentStream(question)
     for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) yield text
     }
}

async function* streamGroq({ system, question }: AnswerRequest): AsyncGenerator<string> {
     const model = getEnv('GROQ_MODEL') ?? 'openai/gpt-oss-20b'

     const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${getEnv('GROQ_API_KEY')}`,
          },
          body: JSON.stringify({
               model,
               stream: true,
               temperature: GENERATION.temperature,
               max_completion_tokens: GENERATION.maxTokens,
               // gpt-oss models "think" before answering; keep that short for speed.
               ...(model.startsWith('openai/gpt-oss') && { reasoning_effort: 'low' }),
               messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: question },
               ],
          }),
     })

     if (!response.ok || !response.body) {
          throw new Error(
               `Groq request failed (${response.status}): ${await response.text()}`,
          )
     }

     const reader = response.body.getReader()
     const decoder = new TextDecoder()
     let buffer = ''

     while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
               if (!line.startsWith('data:')) continue
               const payload = line.slice(5).trim()
               if (!payload || payload === '[DONE]') continue

               // Reasoning arrives in delta.reasoning; only the final answer is delta.content.
               const text = JSON.parse(payload).choices?.[0]?.delta?.content
               if (text) yield text
          }
     }
}
