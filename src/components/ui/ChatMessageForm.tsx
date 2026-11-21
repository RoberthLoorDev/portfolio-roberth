import { useRef, useState, type KeyboardEvent } from 'react'
import userIcon from '../../assets/icons/user.svg'
import awesomeIcon from '../../assets/icons/awesome.svg'

const MAX_HISTORY = 50

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

     const inputRef = useRef<HTMLInputElement>(null)
     // Terminal-style history of sent messages (ArrowUp / ArrowDown to browse it)
     const history = useRef<string[]>([])
     // Position in `history` while browsing; equal to history.length when not browsing
     const historyIndex = useRef(0)
     // What the user was typing before they started browsing, restored on the way back down
     const draft = useRef('')

     const handleSend = async () => {
          const question = userQuestion.trim()
          if (!question) {
               return
          }

          // Remember it (skipping an immediate repeat) and clear the input, like a normal chat
          if (history.current.at(-1) !== question) {
               history.current.push(question)
               if (history.current.length > MAX_HISTORY) history.current.shift()
          }
          historyIndex.current = history.current.length
          draft.current = ''
          setUserQuestion('')
          inputRef.current?.focus()

          setLoading(true)
          setShowResponse(true)
          setAiResponse('')
          setSources([])

          try {
               const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: question }),
               })

               // Validation / rate-limit errors come back as plain JSON
               if (!response.ok || !response.body) {
                    const data = await response.json().catch(() => ({}))
                    setAiResponse(data.error || 'Error al procesar tu mensaje')
                    return
               }

               // Successful answers arrive as newline-delimited JSON events
               const reader = response.body.getReader()
               const decoder = new TextDecoder()
               let buffer = ''

               const handleEvent = (line: string) => {
                    if (!line.trim()) return
                    const event = JSON.parse(line)
                    if (event.type === 'sources') setSources(event.sources ?? [])
                    else if (event.type === 'token')
                         setAiResponse((prev) => prev + event.text)
                    else if (event.type === 'error') setAiResponse(event.message)
               }

               while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() ?? ''
                    lines.forEach(handleEvent)
               }
               handleEvent(buffer)
          } catch (error) {
               console.error('Error:', error)
               setAiResponse('Error de conexión. Intenta de nuevo.')
               setSources([])
          } finally {
               setLoading(false)
          }
     }

     const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          // Enter confirms IME composition (e.g. accents/CJK): don't treat it as "send"
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
               if (!loading) handleSend()
               return
          }

          const entries = history.current
          if (entries.length === 0) return

          if (e.key === 'ArrowUp') {
               e.preventDefault() // keep the caret from jumping to the start
               if (historyIndex.current === entries.length) draft.current = userQuestion
               historyIndex.current = Math.max(0, historyIndex.current - 1)
               setUserQuestion(entries[historyIndex.current])
          } else if (e.key === 'ArrowDown') {
               e.preventDefault()
               if (historyIndex.current >= entries.length) return
               historyIndex.current += 1
               setUserQuestion(
                    historyIndex.current === entries.length
                         ? draft.current
                         : entries[historyIndex.current],
               )
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
                                   ref={inputRef}
                                   onKeyDown={handleKeyDown}
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
