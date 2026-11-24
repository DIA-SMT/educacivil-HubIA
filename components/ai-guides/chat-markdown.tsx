'use client'

import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown de las respuestas del chat. El proyecto no tiene el plugin de tipografía de
 * Tailwind, así que cada elemento lleva sus estilos acá.
 */
const components: Components = {
    p: ({ children }) => <p className="leading-relaxed [&:not(:first-child)]:mt-3">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-700 underline decoration-current/40 underline-offset-2 hover:decoration-current dark:text-sky-300"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-muted-foreground first:mt-0">{children}</ul>,
    ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-muted-foreground first:mt-0">{children}</ol>,
    li: ({ children }) => <li className="pl-1 leading-relaxed [&>p]:mt-0 [&>ul]:mt-1.5 [&>ol]:mt-1.5">{children}</li>,
    h1: ({ children }) => <h3 className="mt-5 text-base font-semibold text-foreground first:mt-0">{children}</h3>,
    h2: ({ children }) => <h3 className="mt-5 text-base font-semibold text-foreground first:mt-0">{children}</h3>,
    h3: ({ children }) => <h3 className="mt-5 text-[15px] font-semibold text-foreground first:mt-0">{children}</h3>,
    h4: ({ children }) => <h4 className="mt-4 font-semibold text-foreground first:mt-0">{children}</h4>,
    blockquote: ({ children }) => (
        <blockquote className="mt-3 border-l-2 border-primary/50 pl-4 text-muted-foreground first:mt-0">{children}</blockquote>
    ),
    hr: () => <hr className="my-4 border-border" />,
    code: ({ children, className }) => {
        const isBlock = /language-/.test(className ?? '')
        if (isBlock) return <code className={className}>{children}</code>
        return <code className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
    },
    pre: ({ children }) => (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/60 p-4 font-mono text-[13px] leading-relaxed first:mt-0">
            {children}
        </pre>
    ),
    table: ({ children }) => (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border first:mt-0">
            <table className="w-full text-left text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-foreground/5 text-foreground">{children}</thead>,
    th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-t border-border px-3 py-2 align-top">{children}</td>,
}

export const ChatMarkdown = memo(function ChatMarkdown({ content }: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
        </ReactMarkdown>
    )
})
