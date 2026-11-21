import {
     lazy,
     Suspense,
     useEffect,
     useRef,
     useState,
     type CSSProperties,
     type KeyboardEvent,
} from 'react'
import './chat.css'

// Loaded only when an answer actually uses Markdown (a list, bold, code...)
const MarkdownAnswer = lazy(() => import('./MarkdownAnswer'))

// Does this text use Markdown? Plain answers (the default) never trigger the renderer.
const MARKDOWN_HINT =
     /(^|\n)[ \t]*(?:[-*+•][ \t]+\S|\d{1,2}[.)][ \t]+\S|#{1,6}[ \t]+\S|>[ \t]?\S|```|\|.+\|)|\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)/

/** Markdown without its symbols, for the screen-reader announcement */
const stripMarkdown = (text: string) =>
     text.replace(/^[ \t]*(?:[-*+•]|#{1,6}|>)[ \t]+/gm, '').replace(/[*_`|]/g, '')

type Lang = 'en' | 'es'

interface Source {
     title: string
     category: string
     similarity: string
}

interface Exchange {
     id: number
     question: string
     answer: string
     sources: Source[]
     error?: boolean
     /** Time until the whole answer arrived, in ms */
     ms?: number
     cached?: boolean
}

const MAX_RECALL = 50 // questions reachable with ArrowUp
const MAX_SAVED = 30 // exchanges kept for the session (hidden history)
const STORAGE_KEY = 'portfolio-chat-v1'
const TYPING_IDLE_MS = 700
// Typewriter pace: steady typing speed, speeding up only when the text arrives faster than it
// is revealed (backlog / ~0.8 s), so long answers never take more than a few seconds
const TYPE_MIN_CPS = 95
const TYPE_CATCHUP = 1.2

const STRINGS = {
     en: {
          title: 'Ask my portfolio',
          subtitle: (n: number) =>
               `Answers drawn from Roberth's real experience · ${n} sources`,
          placeholder: 'Ask about his experience…',
          send: 'Send',
          history: 'History',
          historyEmpty: 'Your earlier questions will show up here.',
          clear: 'Clear history',
          askAgain: 'Ask again',
          hintPrev: 'previous questions',
          hintSend: 'send',
          suggestions: [
               'What is he working on now?',
               'Does he have leadership experience?',
               'Tell me about his React Native work',
               'Which technologies does he use?',
          ],
          searching: (n: number) => `Searching ${n} sources`,
          writing: (k: number) => `${k} sources matched · writing`,
          done: (k: number, time: string) => `Answered from ${k} sources${time}`,
          instant: ' · instant',
          sources: 'Sources',
          sourcesCount: (k: number) => `${k} sources`,
          genericError: 'Something went wrong. Try again in a moment.',
     },
     es: {
          title: 'Pregunta a mi portafolio',
          subtitle: (n: number) =>
               `Respuestas basadas en la experiencia real de Roberth · ${n} fuentes`,
          placeholder: 'Pregunta por su experiencia…',
          send: 'Enviar',
          history: 'Historial',
          historyEmpty: 'Tus preguntas anteriores aparecerán aquí.',
          clear: 'Borrar historial',
          askAgain: 'Preguntar de nuevo',
          hintPrev: 'preguntas anteriores',
          hintSend: 'enviar',
          suggestions: [
               '¿En qué trabaja ahora?',
               '¿Tiene experiencia de liderazgo?',
               'Cuéntame sobre su trabajo con React Native',
               '¿Qué tecnologías usa?',
          ],
          searching: (n: number) => `Buscando en ${n} fuentes`,
          writing: (k: number) => `${k} fuentes encontradas · redactando`,
          done: (k: number, time: string) => `Respondido con ${k} fuentes${time}`,
          instant: ' · al instante',
          sources: 'Fuentes',
          sourcesCount: (k: number) => `${k} fuentes`,
          genericError: 'Algo salió mal. Inténtalo de nuevo en un momento.',
     },
} as const

const ArrowUpIcon = () => (
     <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
     </svg>
)

const ClockIcon = () => (
     <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
     </svg>
)

const ChevronIcon = () => (
     <svg
          className="chat__chev"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="m9 6 6 6-6 6" />
     </svg>
)

/** An answer as plain text or, when it uses Markdown, as formatted content */
function AnswerText({
     text,
     markdown,
     partial = false,
     caret,
}: {
     text: string
     markdown: boolean
     partial?: boolean
     /** Blinking cursor state; leave undefined to render no cursor at all */
     caret?: boolean
}) {
     if (!markdown) {
          return (
               <>
                    {text}
                    {caret !== undefined && (
                         <span
                              className="chat__caret"
                              data-on={caret}
                              aria-hidden="true"
                         />
                    )}
               </>
          )
     }
     return (
          // While the renderer downloads (first time only) show the text without Markdown symbols
          <Suspense fallback={<>{stripMarkdown(text)}</>}>
               <MarkdownAnswer text={text} partial={partial} caret={!!caret} />
          </Suspense>
     )
}

function Orb({ small = false }: { small?: boolean }) {
     return (
          <div className={`chat__orb${small ? ' chat__orb--sm' : ''}`} aria-hidden="true">
               <i className="chat__orb-ring" />
               <i className="chat__orb-ring" />
               <i className="chat__orb-core" />
          </div>
     )
}

function SourceMeters({ sources, title }: { sources: Source[]; title: string }) {
     return (
          <div className="chat__sources">
               <p className="chat__sources-title">{title}</p>
               <ul className="chat__src-list">
                    {sources.map((s, i) => (
                         <li
                              key={`${s.title}-${i}`}
                              className="chat__src"
                              style={{ '--i': i, '--pct': s.similarity } as CSSProperties}
                         >
                              <div className="chat__src-top">
                                   <b className="chat__src-pct">{s.similarity}</b>
                                   <em
                                        className="chat__src-name"
                                        title={`${s.title} · ${s.category}`}
                                   >
                                        {s.title}
                                   </em>
                              </div>
                              <div className="chat__meter">
                                   <i />
                              </div>
                         </li>
                    ))}
               </ul>
          </div>
     )
}

export default function ChatMessageForm({
     knowledgeCount = 21,
}: {
     knowledgeCount?: number
}) {
     const [lang, setLang] = useState<Lang>('en')
     const t = STRINGS[lang]

     const [question, setQuestion] = useState('')
     const [loading, setLoading] = useState(false)
     const [exchanges, setExchanges] = useState<Exchange[]>([])
     const [activeId, setActiveId] = useState<number | null>(null)
     const [shown, setShown] = useState(0) // characters of the active answer revealed so far
     const [typing, setTyping] = useState(false) // the visitor is typing right now
     const [historyOpen, setHistoryOpen] = useState(false)
     const [expandedId, setExpandedId] = useState<number | null>(null)
     const [hydrated, setHydrated] = useState(false)
     const [reducedMotion, setReducedMotion] = useState(false)

     const inputRef = useRef<HTMLInputElement>(null)
     const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
     const shownRef = useRef({ id: 0, pos: 0 }) // pos is fractional; `shown` is its floor

     // Terminal-style recall of sent questions (ArrowUp / ArrowDown)
     const recall = useRef<string[]>([])
     const recallIndex = useRef(0) // equals recall.length when not browsing
     const draft = useRef('') // what was being typed before browsing

     const active = exchanges.find((e) => e.id === activeId)
     const past = exchanges
          .filter((e) => e.id !== activeId && e.answer && !e.error)
          .reverse()

     // ---- language follows the site's selector (it sets <html lang>) ----
     useEffect(() => {
          const read = () => {
               let value = document.documentElement.lang
               try {
                    value = localStorage.getItem('portfolio-lang') || value
               } catch {}
               setLang(value?.startsWith('es') ? 'es' : 'en')
          }
          read()
          const observer = new MutationObserver(read)
          observer.observe(document.documentElement, {
               attributes: true,
               attributeFilter: ['lang'],
          })
          return () => observer.disconnect()
     }, [])

     useEffect(() => {
          const query = window.matchMedia('(prefers-reduced-motion: reduce)')
          const update = () => setReducedMotion(query.matches)
          update()
          query.addEventListener('change', update)
          return () => query.removeEventListener('change', update)
     }, [])

     // ---- the hidden history survives reloads within the session ----
     useEffect(() => {
          try {
               const raw = sessionStorage.getItem(STORAGE_KEY)
               const saved = raw ? (JSON.parse(raw) as Exchange[]) : []
               if (Array.isArray(saved) && saved.length > 0) {
                    setExchanges(saved)
                    recall.current = saved
                         .map((e) => e.question)
                         .filter((q, i, all) => q !== all[i - 1])
                         .slice(-MAX_RECALL)
                    recallIndex.current = recall.current.length
               }
          } catch {}
          setHydrated(true)
     }, [])

     useEffect(() => {
          if (!hydrated || loading) return
          try {
               const keep = exchanges
                    .filter((e) => e.answer && !e.error)
                    .slice(-MAX_SAVED)
               sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keep))
          } catch {}
     }, [exchanges, loading, hydrated])

     useEffect(() => () => clearTimeout(typingTimer.current), [])

     // ---- typewriter: reveal the answer at a steady pace even when it arrives in one burst ----
     const instant = reducedMotion || !!active?.error
     const answerLength = active?.answer.length ?? 0

     useEffect(() => {
          if (!active || instant) return
          let raf = 0
          let last = performance.now()
          // Time-based (not per frame) so 60 Hz and 120 Hz screens type at the same speed
          const tick = (now: number) => {
               const dt = Math.min(0.05, (now - last) / 1000)
               last = now
               const current =
                    shownRef.current.id === active.id ? shownRef.current.pos : 0
               if (current >= answerLength) return
               const speed = Math.max(
                    TYPE_MIN_CPS,
                    (answerLength - current) * TYPE_CATCHUP,
               )
               const next = Math.min(answerLength, current + speed * dt)
               shownRef.current = { id: active.id, pos: next }
               setShown(Math.floor(next))
               raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
          return () => cancelAnimationFrame(raf)
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [active?.id, answerLength, instant])

     const visibleAnswer = !active
          ? ''
          : instant
            ? active.answer
            : active.answer.slice(0, Math.min(shown, answerLength))
     // Decided from the whole answer (not the partial text) so the layout doesn't switch mid-typing
     const isMarkdown = !!active && !active.error && MARKDOWN_HINT.test(active.answer)
     const writing = !!active && (loading || (!instant && shown < answerLength))
     const searching =
          loading && !!active && active.sources.length === 0 && !active.answer
     const finished = !!active && !writing && !loading
     const phase = searching
          ? 'searching'
          : writing
            ? 'writing'
            : typing
              ? 'typing'
              : 'idle'

     // ---- sending ----
     const send = async (raw: string) => {
          const text = raw.trim()
          if (!text || loading) return

          if (recall.current.at(-1) !== text) {
               recall.current.push(text)
               if (recall.current.length > MAX_RECALL) recall.current.shift()
          }
          recallIndex.current = recall.current.length
          draft.current = ''
          clearTimeout(typingTimer.current)
          setTyping(false)
          setQuestion('')
          inputRef.current?.focus()

          const id = Date.now()
          const startedAt = performance.now()
          shownRef.current = { id, pos: 0 }
          setShown(0)
          setExchanges((prev) => [
               ...prev.slice(-(MAX_SAVED - 1)),
               { id, question: text, answer: '', sources: [] },
          ])
          setActiveId(id)
          setLoading(true)

          const patch = (fn: (e: Exchange) => Exchange) =>
               setExchanges((prev) => prev.map((e) => (e.id === id ? fn(e) : e)))
          const fail = (message: string) =>
               patch((e) => ({ ...e, answer: message, sources: [], error: true }))

          try {
               const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text }),
               })

               // Validation / rate-limit errors come back as plain JSON
               if (!response.ok || !response.body) {
                    const data = await response.json().catch(() => ({}))
                    fail(data.error || t.genericError)
                    return
               }

               // Successful answers arrive as newline-delimited JSON events
               const reader = response.body.getReader()
               const decoder = new TextDecoder()
               let buffer = ''

               const handleEvent = (line: string) => {
                    if (!line.trim()) return
                    const event = JSON.parse(line)
                    if (event.type === 'sources') {
                         patch((e) => ({ ...e, sources: event.sources ?? [] }))
                    } else if (event.type === 'token') {
                         patch((e) => ({ ...e, answer: e.answer + event.text }))
                    } else if (event.type === 'error') {
                         fail(event.message)
                    } else if (event.type === 'done') {
                         patch((e) => ({
                              ...e,
                              ms: Math.round(performance.now() - startedAt),
                              cached: !!event.cached,
                         }))
                    }
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
               fail(t.genericError)
          } finally {
               setLoading(false)
          }
     }

     const handleChange = (value: string) => {
          setQuestion(value)
          clearTimeout(typingTimer.current)
          if (!value) {
               setTyping(false)
               return
          }
          setTyping(true)
          typingTimer.current = setTimeout(() => setTyping(false), TYPING_IDLE_MS)
     }

     const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          // Enter confirms IME composition (accents/CJK): don't treat it as "send"
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
               if (!loading) send(question)
               return
          }

          const entries = recall.current
          if (entries.length === 0) return

          if (e.key === 'ArrowUp') {
               e.preventDefault() // keep the caret from jumping to the start
               if (recallIndex.current === entries.length) draft.current = question
               recallIndex.current = Math.max(0, recallIndex.current - 1)
               setQuestion(entries[recallIndex.current])
          } else if (e.key === 'ArrowDown') {
               e.preventDefault()
               if (recallIndex.current >= entries.length) return
               recallIndex.current += 1
               setQuestion(
                    recallIndex.current === entries.length
                         ? draft.current
                         : entries[recallIndex.current],
               )
          }
     }

     const askAgain = (text: string) => {
          setQuestion(text)
          setHistoryOpen(false)
          inputRef.current?.focus()
     }

     const clearHistory = () => {
          setExchanges((prev) => prev.filter((e) => e.id === activeId))
          recall.current = []
          recallIndex.current = 0
          setExpandedId(null)
     }

     const timeOf = (id: number) =>
          new Date(id).toLocaleTimeString(lang === 'es' ? 'es-EC' : 'en-US', {
               hour: '2-digit',
               minute: '2-digit',
          })

     const sourceCount = active?.sources.length ?? 0
     const seconds = active?.ms !== undefined ? (active.ms / 1000).toFixed(1) : null
     const timeLabel =
          active?.cached || (active?.ms !== undefined && active.ms < 100)
               ? t.instant
               : seconds
                 ? ` · ${seconds} s`
                 : ''

     return (
          <div className="chat" data-phase={phase}>
               <div className="chat__card">
                    <header className="chat__head">
                         <Orb />
                         <div className="chat__titles">
                              <h3 className="chat__title">{t.title}</h3>
                              <p className="chat__sub">{t.subtitle(knowledgeCount)}</p>
                         </div>
                         <button
                              type="button"
                              className="chat__hist-btn"
                              aria-expanded={historyOpen}
                              aria-controls="chat-history"
                              onClick={() => setHistoryOpen((open) => !open)}
                         >
                              <ClockIcon />
                              <span className="chat__hist-label">{t.history}</span>
                              {past.length > 0 && (
                                   <span className="chat__badge" key={past.length}>
                                        {past.length}
                                   </span>
                              )}
                         </button>
                    </header>

                    {/* Hidden history: closed by default */}
                    <div
                         id="chat-history"
                         className="chat__drawer"
                         data-open={historyOpen}
                         inert={!historyOpen}
                    >
                         <div className="chat__drawer-inner">
                              <ul className="chat__hist-list">
                                   {past.length === 0 && (
                                        <li className="chat__hist-empty">
                                             {t.historyEmpty}
                                        </li>
                                   )}
                                   {past.map((e) => {
                                        const open = expandedId === e.id
                                        return (
                                             <li key={e.id} className="chat__hist-item">
                                                  <button
                                                       type="button"
                                                       className="chat__hist-row"
                                                       aria-expanded={open}
                                                       onClick={() =>
                                                            setExpandedId(
                                                                 open ? null : e.id,
                                                            )
                                                       }
                                                  >
                                                       <ChevronIcon />
                                                       <span className="chat__hist-q">
                                                            {e.question}
                                                       </span>
                                                       <span className="chat__hist-time">
                                                            {timeOf(e.id)}
                                                       </span>
                                                  </button>
                                                  <div
                                                       className="chat__hist-body"
                                                       data-open={open}
                                                  >
                                                       <div>
                                                            <div
                                                                 className={`chat__hist-answer${MARKDOWN_HINT.test(e.answer) ? ' chat__hist-answer--md' : ''}`}
                                                            >
                                                                 <AnswerText
                                                                      text={e.answer}
                                                                      markdown={MARKDOWN_HINT.test(
                                                                           e.answer,
                                                                      )}
                                                                 />
                                                            </div>
                                                            <div className="chat__hist-meta">
                                                                 <small>
                                                                      {t.sourcesCount(
                                                                           e.sources
                                                                                .length,
                                                                      )}
                                                                      {e.sources[0]
                                                                           ? ` · ${e.sources[0].similarity}`
                                                                           : ''}
                                                                 </small>
                                                                 <button
                                                                      type="button"
                                                                      className="chat__link"
                                                                      onClick={() =>
                                                                           askAgain(
                                                                                e.question,
                                                                           )
                                                                      }
                                                                 >
                                                                      {t.askAgain}
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </li>
                                        )
                                   })}
                                   {past.length > 0 && (
                                        <li className="chat__hist-foot">
                                             <button
                                                  type="button"
                                                  className="chat__link"
                                                  onClick={clearHistory}
                                             >
                                                  {t.clear}
                                             </button>
                                        </li>
                                   )}
                              </ul>
                         </div>
                    </div>

                    {/* Composer */}
                    <div className="chat__composer" data-typing={typing}>
                         <span className="chat__prompt" aria-hidden="true">
                              ›
                         </span>
                         <input
                              id="userQuestion"
                              ref={inputRef}
                              className="chat__input"
                              type="text"
                              value={question}
                              maxLength={500}
                              autoComplete="off"
                              spellCheck={false}
                              enterKeyHint="send"
                              aria-label={t.placeholder}
                              placeholder={t.placeholder}
                              onChange={(e) => handleChange(e.target.value)}
                              onKeyDown={handleKeyDown}
                         />
                         <button
                              id="sendBtn"
                              type="button"
                              className="chat__send"
                              data-armed={question.trim().length > 0 && !loading}
                              disabled={loading}
                              aria-label={t.send}
                              onClick={() => send(question)}
                         >
                              <ArrowUpIcon />
                         </button>
                         <span className="chat__sweep" aria-hidden="true" />
                    </div>

                    <p className="chat__hint">
                         <small>
                              <kbd>↑</kbd> <kbd>↓</kbd> {t.hintPrev}
                         </small>
                         <small>
                              <kbd>⏎</kbd> {t.hintSend}
                         </small>
                    </p>

                    {/* Empty state: suggestions go through the normal flow */}
                    {!active && (
                         <div className="chat__chips">
                              {t.suggestions.map((text, i) => (
                                   <button
                                        key={text}
                                        type="button"
                                        className="chat__chip"
                                        style={{ '--i': i } as CSSProperties}
                                        onClick={() => send(text)}
                                   >
                                        <i aria-hidden="true">›</i>
                                        {text}
                                   </button>
                              ))}
                         </div>
                    )}

                    {/* Current exchange */}
                    {active && (
                         <div className="chat__thread" key={active.id}>
                              <div className="chat__user">{active.question}</div>

                              <div className="chat__reply">
                                   <Orb small />
                                   <div className="chat__body">
                                        {!active.error && (
                                             <div
                                                  className="chat__status"
                                                  data-state={
                                                       finished ? 'done' : 'working'
                                                  }
                                             >
                                                  <span
                                                       className="chat__status-dot"
                                                       aria-hidden="true"
                                                  />
                                                  <b>
                                                       {searching
                                                            ? t.searching(knowledgeCount)
                                                            : finished
                                                              ? t.done(
                                                                     sourceCount,
                                                                     timeLabel,
                                                                )
                                                              : t.writing(sourceCount)}
                                                  </b>
                                             </div>
                                        )}

                                        <div
                                             className={`chat__answer ai-text${active.error ? ' chat__answer--error' : ''}${isMarkdown ? ' chat__answer--md' : ''}`}
                                             aria-hidden={writing}
                                        >
                                             <AnswerText
                                                  text={visibleAnswer}
                                                  markdown={isMarkdown}
                                                  partial={writing}
                                                  caret={writing && !active.error}
                                             />
                                        </div>
                                        <div
                                             className="chat__sr"
                                             role="status"
                                             aria-live="polite"
                                        >
                                             {finished
                                                  ? isMarkdown
                                                       ? stripMarkdown(active.answer)
                                                       : active.answer
                                                  : ''}
                                        </div>

                                        {finished && sourceCount > 0 && (
                                             <SourceMeters
                                                  sources={active.sources}
                                                  title={t.sources}
                                             />
                                        )}
                                   </div>
                              </div>
                         </div>
                    )}
               </div>
          </div>
     )
}
