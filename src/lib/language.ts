// Tiny en/es detector. The model sometimes answers in Spanish (the language of the portfolio
// data) even when asked in English, so we detect the language here and tell it explicitly.

const SPANISH =
     /[¿¡áéíóúñü]|\b(el|la|los|las|del|que|qué|cómo|como|dónde|donde|cuál|cual|cuáles|cuales|cuándo|quién|quien|tiene|tienes|sobre|para|por|una|es|su|sus|habla|hablas|experiencia|proyectos|estudió|estudio|trabaja|trabajó|cuéntame|cuentame|dime|háblame|hablame|y|con|en|de|al)\b/gi

const ENGLISH =
     /\b(the|what|where|which|who|whom|how|when|why|does|do|did|is|are|was|were|his|her|he|she|they|tell|about|with|and|of|in|on|for|experience|skills|projects|work|worked|study|studied|speak|technologies|technology|use|uses|used|have|has|can|could|me|you|your)\b/gi

export type Language = 'en' | 'es'

/** Returns the detected language, or undefined when the text is too short/ambiguous. */
export function detectLanguage(text: string): Language | undefined {
     const spanish = text.match(SPANISH)?.length ?? 0
     const english = text.match(ENGLISH)?.length ?? 0
     if (spanish === 0 && english === 0) return undefined
     // Accents / ¿ ¡ are a strong Spanish signal
     if (/[¿¡áéíóúñü]/i.test(text)) return 'es'
     if (english > spanish) return 'en'
     if (spanish > english) return 'es'
     return undefined
}

/** Appends an explicit language instruction to the question sent to the model. */
export function withLanguageInstruction(question: string): string {
     const language = detectLanguage(question)
     if (language === 'en') return `${question}\n\n(Answer in English.)`
     if (language === 'es') return `${question}\n\n(Responde en español.)`
     return question
}
