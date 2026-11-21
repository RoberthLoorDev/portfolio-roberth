// Renders the model's Markdown. Loaded on demand (lazy) so visitors who only get plain answers
// never download it. Safe by construction: react-markdown builds React elements (no innerHTML),
// raw HTML is shown as text, and only the elements below are allowed (no images or iframes).
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const ALLOWED_ELEMENTS = [
     'p',
     'br',
     'strong',
     'em',
     'del',
     'ul',
     'ol',
     'li',
     'code',
     'pre',
     'a',
     'blockquote',
     'hr',
     'h1',
     'h2',
     'h3',
     'h4',
     'h5',
     'h6',
     'table',
     'thead',
     'tbody',
     'tr',
     'th',
     'td',
]

const Heading = ({ children }: { children?: React.ReactNode }) => (
     <p className="chat__md-h">{children}</p>
)

const components: Components = {
     // Links open in a new tab and never leak the page. Unsafe schemes (javascript:, data:)
     // are already dropped by react-markdown's default URL transform, leaving no href.
     a: ({ href, children }) =>
          href ? (
               <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                    {children}
               </a>
          ) : (
               <>{children}</>
          ),
     // Keep the chat compact: every heading level becomes the same bold line
     h1: Heading,
     h2: Heading,
     h3: Heading,
     h4: Heading,
     h5: Heading,
     h6: Heading,
}

/**
 * While the answer is still being typed the Markdown is incomplete. Close dangling emphasis and
 * code so the visitor never sees stray `**` or ``` flicker in and out.
 */
export function healPartialMarkdown(text: string): string {
     if ((text.match(/```/g) ?? []).length % 2 === 1) return `${text}\n\`\`\``

     // A closing marker only counts when it touches the text ("**bold **" is not bold), so drop
     // any trailing space before appending it
     let out = text
     if ((out.match(/\*\*/g) ?? []).length % 2 === 1) {
          out = out.endsWith('**') ? out.slice(0, -2) : `${out.trimEnd()}**`
     }
     const withoutFences = out.replace(/```/g, '')
     if ((withoutFences.match(/`/g) ?? []).length % 2 === 1) {
          out = out.endsWith('`') ? out.slice(0, -1) : `${out.trimEnd()}\``
     }
     return out
}

interface Props {
     text: string
     /** True while the answer is still being typed */
     partial?: boolean
     /** Show the blinking cursor at the end of the last block */
     caret?: boolean
}

export default function MarkdownAnswer({ text, partial = false, caret = false }: Props) {
     // The model sometimes writes "•" bullets, which Markdown does not treat as a list
     const source = text.replace(/^[ \t]*•[ \t]+/gm, '- ')

     return (
          <div className="chat__md" data-caret={caret}>
               <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    allowedElements={ALLOWED_ELEMENTS}
                    unwrapDisallowed
                    components={components}
               >
                    {partial ? healPartialMarkdown(source) : source}
               </ReactMarkdown>
          </div>
     )
}
