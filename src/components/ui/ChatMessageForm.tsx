import { useState } from 'react'
import userIcon from '../../assets/icons/user.svg'
import awesomeIcon from '../../assets/icons/awesome.svg'

interface Source {
     title: string
     category: string
     similarity: string
}

export default function ChatMessageForm() {
     const [userQuestion, setUserQuestion] = useState('')
     const [loading, setLoading] = useState(false)
     const [aiResponse, setAiResponse] = useState('')
     const [sources, setSources] = useState<Source[]>([])
     const [showResponse, setShowResponse] = useState(false)

     const handleSend = async () => {
          const question = userQuestion.trim()
          if (!question) {
               return
          }

          setLoading(true)
          setShowResponse(true)
          setAiResponse('Sending...')

          try {
               const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: question }),
               })

               const data = await response.json()

               if (!response.ok || data.error) {
                    setAiResponse(data.error || 'Error al procesar tu mensaje')
                    setSources([])
               } else {
                    setAiResponse(data.response)
                    setSources(data.sources || [])
               }
          } catch (error) {
               console.error('Error:', error)
               setAiResponse('Error de conexión. Intenta de nuevo.')
               setSources([])
          } finally {
               setLoading(false)
          }
     }

     return (
          <div className="relative p-4 sm:p-6 backdrop-blur-sm border border-none rounded-lg w-full text-md">
               <div className="mb-6">
                    <div className="flex items-center gap-3 p-4 border border-blue-400/30 rounded-lg bg-slate-900/20 dark:bg-slate-900/50">
                         <img className="w-5 h-5" alt="User" src={userIcon.src} />

                         <div className="flex flex-col sm:flex-row items-center w-full gap-3">
                              <input
                                   id="userQuestion"
                                   value={userQuestion}
                                   onChange={(e) => setUserQuestion(e.target.value)}
                                   onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !loading) {
                                             handleSend()
                                        }
                                   }}
                                   className="text-white w-full sm:flex-1 bg-transparent border-0 px-0 py-2 sm:py-1  placeholder-slate-500 focus:outline-none"
                                   type="text"
                                   placeholder="What are your main skills?"
                              />
                              <button
                                   id="sendBtn"
                                   type="button"
                                   onClick={handleSend}
                                   disabled={loading}
                                   className={`w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        loading ? 'opacity-60 cursor-not-allowed' : ''
                                   }`}
                              >
                                   Send
                              </button>
                         </div>
                    </div>
               </div>

               {/* AI Response */}
               {showResponse && (
                    <div className="w-full">
                         <div className="flex items-start gap-3 w-full">
                              <div className="flex-shrink-0 self-start">
                                   {/* Loading spinner */}
                                   {loading && (
                                        <div className="grid place-items-center -mt-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full animate-in fade-in zoom-in duration-300">
                                             <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                        </div>
                                   )}

                                   {!loading && (
                                        <div className="grid place-items-center -mt-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/20 ring-1 ring-blue-500/50 animate-in fade-in zoom-in duration-300">
                                             <img
                                                  className="w-4 h-4 sm:w-5 sm:h-5"
                                                  alt="AI"
                                                  src={awesomeIcon.src}
                                             />
                                        </div>
                                   )}
                              </div>

                              <div className="flex-1 w-full max-w-full">
                                   <p className="text-slate-400 leading-relaxed w-full break-words">
                                        <span className="font-bold text-slate-200">
                                             AI:
                                        </span>{' '}
                                        <span className="ai-text text-[#94A3B8]">
                                             {aiResponse}
                                        </span>
                                   </p>

                                   {/* Sources */}
                                   {sources.length > 0 && !loading && (
                                        <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                                             📚 Sources:{' '}
                                             {sources
                                                  .map(
                                                       (s) =>
                                                            `${s.title} (${s.similarity})`,
                                                  )
                                                  .join(', ')}
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>
               )}
          </div>
     )
}
