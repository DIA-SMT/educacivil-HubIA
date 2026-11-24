'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import {
    ArrowLeft,
    ArrowUp,
    Check,
    ChevronDown,
    Copy,
    ExternalLink,
    Landmark,
    LayoutGrid,
    LogIn,
    RotateCcw,
    Send,
    Sparkles,
    Square,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { ChatMarkdown } from '@/components/ai-guides/chat-markdown'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getGuideMeta, type GuideMeta } from '@/lib/ai-guides/meta'
import { CIUDAD_DIGITAL_URL, MIGUE_TELEGRAM_URL } from '@/lib/ai-guides/canales'
import {
    CHAT_DAILY_LIMIT,
    CHAT_MAX_USER_MESSAGE_CHARS,
    type ChatErrorCode,
    type ChatMessageMetadata,
} from '@/lib/ai-guides/limits'
import { cn } from '@/lib/utils'

interface Guide {
    id: string
    slug?: string
    title: string
    objective?: string
    category: string
}

interface AiChatInterfaceProps {
    guide: Guide
    allGuides: Guide[]
    /** Mensajes que le quedan hoy con este asistente (null si no se pudo calcular). */
    initialRemaining: number | null
}

type ChatMessage = UIMessage<ChatMessageMetadata>

const GENERIC_ERROR = 'No pudimos conectarnos con el asistente. Revisá tu conexión y probá de nuevo.'

function parseChatError(error: Error | undefined): { code: ChatErrorCode | 'unknown'; message: string } | null {
    if (!error) return null
    const raw = error.message?.trim() ?? ''
    try {
        const body = JSON.parse(raw)
        if (body && typeof body.message === 'string') return { code: body.code ?? 'unknown', message: body.message }
    } catch {
        // No es JSON: puede ser el texto que manda el stream cuando se corta.
    }
    if (raw && raw.length < 300 && !/failed to fetch|network|load failed/i.test(raw) && !raw.startsWith('<')) {
        return { code: 'unknown', message: raw }
    }
    return { code: 'unknown', message: GENERIC_ERROR }
}

function getMessageText(m: ChatMessage) {
    return m.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')
}

function GuideAvatar({ meta, size = 'md', className }: { meta: GuideMeta; size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const Icon = meta.icon
    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center border',
                meta.accent.soft,
                meta.accent.border,
                meta.accent.text,
                size === 'sm' && 'h-8 w-8 rounded-lg',
                size === 'md' && 'h-10 w-10 rounded-xl',
                size === 'lg' && cn('h-20 w-20 rounded-3xl', meta.accent.glow),
                className,
            )}
        >
            <Icon className={cn(size === 'sm' && 'h-4 w-4', size === 'md' && 'h-5 w-5', size === 'lg' && 'h-10 w-10')} />
        </div>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            type="button"
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                } catch {
                    // Sin permiso para el portapapeles: no hacemos nada.
                }
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Copiar respuesta"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
        </button>
    )
}

function ThinkingBubble({ meta }: { meta: GuideMeta }) {
    const [index, setIndex] = useState(0)
    useEffect(() => {
        const id = setInterval(() => setIndex((i) => (i + 1) % meta.thinking.length), 2200)
        return () => clearInterval(id)
    }, [meta.thinking.length])

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            <GuideAvatar meta={meta} size="sm" className="mt-0.5" />
            <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-border bg-card/80 px-4 py-3">
                <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className={cn('h-1.5 w-1.5 rounded-full bg-current', meta.accent.text)}
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        />
                    ))}
                </span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-muted-foreground"
                    >
                        {meta.thinking[index]}
                    </motion.span>
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export function AiChatInterface({ guide, allGuides, initialRemaining }: AiChatInterfaceProps) {
    const meta = getGuideMeta(guide)
    const [inputValue, setInputValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const stickToBottom = useRef(true)

    const transport = useMemo(
        () => new DefaultChatTransport({ api: '/api/chat', body: { guideId: guide.id } }),
        [guide.id],
    )

    const { messages, sendMessage, status, error, stop, regenerate, setMessages, clearError } = useChat<ChatMessage>({
        id: `chat-${guide.id}`,
        transport,
    })

    const isBusy = status === 'submitted' || status === 'streaming'
    const chatError = parseChatError(error)

    // Mensajes restantes: el último dato que mandó el servidor, o el inicial.
    const remaining = useMemo(() => {
        if (chatError?.code === 'rate_limit') return 0
        for (let i = messages.length - 1; i >= 0; i--) {
            const r = messages[i].metadata?.remaining
            if (typeof r === 'number') return r
        }
        return initialRemaining
    }, [messages, initialRemaining, chatError?.code])
    const outOfMessages = remaining === 0

    const lastMessage = messages[messages.length - 1]
    const waitingFirstToken =
        status === 'submitted' ||
        (status === 'streaming' && lastMessage?.role === 'assistant' && !getMessageText(lastMessage))

    // Scroll: seguimos el final de la charla salvo que la persona haya subido a leer.
    const handleScroll = () => {
        const el = scrollRef.current
        if (!el) return
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96
    }
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        if (messages.length === 0) {
            el.scrollTop = 0 // la bienvenida se lee desde arriba
            return
        }
        if (stickToBottom.current) el.scrollTop = el.scrollHeight
    }, [messages, status, error])

    // Textarea que crece con el contenido.
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
    }, [inputValue])

    const send = useCallback(
        async (raw: string) => {
            const text = raw.trim()
            if (!text || isBusy || outOfMessages || text.length > CHAT_MAX_USER_MESSAGE_CHARS) return
            clearError()
            stickToBottom.current = true
            setInputValue('')
            try {
                await sendMessage({ text })
            } catch (err) {
                console.error('Error sending message:', err)
            }
        },
        [isBusy, outOfMessages, sendMessage, clearError],
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            void send(inputValue)
        }
    }

    const resetChat = () => {
        stop()
        clearError()
        setMessages([])
        setInputValue('')
        textareaRef.current?.focus()
    }

    const charsLeft = CHAT_MAX_USER_MESSAGE_CHARS - inputValue.length
    const isEmpty = messages.length === 0
    const otherGuides = allGuides.filter((g) => g.id !== guide.id)

    return (
        <div className="flex h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background text-foreground">
            {/* Lista de asistentes (escritorio) */}
            <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 md:flex lg:w-80">
                <div className="px-5 pb-3 pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Asistentes ciudadanIA</p>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                    {allGuides.map((g) => {
                        const gMeta = getGuideMeta(g)
                        const isActive = g.id === guide.id
                        return (
                            <Link
                                key={g.id}
                                href={`/ai-guides/${g.slug}`}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                                    isActive ? 'bg-foreground/[0.06] ring-1 ring-foreground/10' : 'hover:bg-foreground/[0.05]',
                                )}
                            >
                                <GuideAvatar meta={gMeta} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className={cn('truncate text-sm font-medium', isActive ? 'text-foreground' : 'text-foreground/85')}>
                                        {g.title}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">{g.category}</p>
                                </div>
                            </Link>
                        )
                    })}
                </nav>
                <div className="space-y-1 border-t border-border p-3">
                    <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Trámites y reclamos
                    </p>
                    <a
                        href={MIGUE_TELEGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                        <Send className="h-4 w-4" />
                        Migue en Telegram
                        <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
                    </a>
                    <a
                        href={CIUDAD_DIGITAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                        <Landmark className="h-4 w-4" />
                        Ciudad Digital
                        <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
                    </a>
                    <div className="my-1 border-t border-border" />
                    <Link
                        href="/ai-guides"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Ver todos los asistentes
                    </Link>
                </div>
            </aside>

            {/* Charla */}
            <section className="flex min-w-0 flex-1 flex-col">
                {/* Encabezado */}
                <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/40 px-3 sm:px-6">
                    <Link
                        href="/ai-guides"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground md:hidden"
                        aria-label="Volver a los asistentes"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <GuideAvatar meta={meta} size="md" />
                    <div className="min-w-0 flex-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="flex max-w-full items-center gap-1 rounded-md text-left focus:outline-none md:pointer-events-none"
                                disabled={otherGuides.length === 0}
                            >
                                <h1 className="truncate text-base font-semibold sm:text-lg">{guide.title}</h1>
                                {otherGuides.length > 0 && <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" />}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-72">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar de asistente</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {otherGuides.map((g) => {
                                    const gMeta = getGuideMeta(g)
                                    return (
                                        <DropdownMenuItem key={g.id} asChild>
                                            <Link href={`/ai-guides/${g.slug}`} className="flex items-center gap-3">
                                                <GuideAvatar meta={gMeta} size="sm" />
                                                <span className="truncate">{g.title}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <p className="truncate text-xs text-muted-foreground">{guide.category}</p>
                    </div>
                    {!isEmpty && (
                        <button
                            type="button"
                            onClick={resetChat}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="hidden sm:inline">Nueva charla</span>
                        </button>
                    )}
                </header>

                {/* Mensajes */}
                <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                        {isEmpty ? (
                            // Animación por CSS: se ve aunque el JS todavía no haya hidratado la página.
                            <div className="flex flex-col items-center pt-2 text-center animate-in fade-in-0 slide-in-from-bottom-3 duration-500 sm:pt-8">
                                <GuideAvatar meta={meta} size="lg" />
                                <div className="mt-6 max-w-xl text-[15px] text-foreground/90 sm:text-base">
                                    <ChatMarkdown content={meta.greeting} />
                                </div>
                                <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
                                    {meta.starters.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => void send(s)}
                                            disabled={outOfMessages}
                                            className={cn(
                                                'group flex items-start gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 text-left text-sm text-foreground/85 transition-all',
                                                'hover:-translate-y-0.5 hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
                                            )}
                                        >
                                            <Sparkles className={cn('mt-0.5 h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100', meta.accent.text)} />
                                            <span>{s}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground">
                                    ¿Tenés que hacer un trámite o un reclamo en la Muni? Escribile a{' '}
                                    <a href={MIGUE_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-700 hover:underline dark:text-sky-300">
                                        Migue por Telegram
                                    </a>{' '}
                                    o entrá a{' '}
                                    <a href={CIUDAD_DIGITAL_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-700 hover:underline dark:text-sky-300">
                                        Ciudad Digital
                                    </a>
                                    .
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((m, i) => {
                                    const content = getMessageText(m)
                                    if (!content) return null
                                    const isStreamingThis = status === 'streaming' && i === messages.length - 1

                                    if (m.role === 'user') {
                                        return (
                                            <motion.div
                                                key={m.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex justify-end"
                                            >
                                                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground sm:max-w-[75%]">
                                                    {content}
                                                </div>
                                            </motion.div>
                                        )
                                    }

                                    return (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group flex items-start gap-3"
                                        >
                                            <GuideAvatar meta={meta} size="sm" className="mt-0.5" />
                                            <div className="min-w-0 max-w-[calc(100%-2.75rem)]">
                                                <div className="break-words rounded-2xl rounded-tl-md border border-border bg-card/80 px-4 py-3 text-[15px] text-foreground/90">
                                                    <ChatMarkdown content={content} />
                                                </div>
                                                {!isStreamingThis && (
                                                    <div className="mt-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                        <CopyButton text={content} />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}

                                {waitingFirstToken && <ThinkingBubble meta={meta} />}
                            </div>
                        )}

                        {chatError && (
                            <div
                                role="alert"
                                className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 sm:flex-row sm:items-center"
                            >
                                <p className="flex-1">{chatError.message}</p>
                                {chatError.code === 'unauthorized' ? (
                                    <Link
                                        href="/signin"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-1.5 font-medium hover:bg-amber-400/30"
                                    >
                                        <LogIn className="h-4 w-4" /> Ingresar
                                    </Link>
                                ) : chatError.code !== 'rate_limit' && chatError.code !== 'too_long' ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            stickToBottom.current = true
                                            void regenerate()
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-1.5 font-medium hover:bg-amber-400/30"
                                    >
                                        <RotateCcw className="h-4 w-4" /> Reintentar
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Caja de texto */}
                <div className="shrink-0 border-t border-border bg-card/40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
                    <div className="mx-auto max-w-3xl">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                void send(inputValue)
                            }}
                            className={cn(
                                'flex items-end gap-2 rounded-2xl border border-border bg-background/60 p-2 pl-4 transition-shadow',
                                'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
                                outOfMessages && 'opacity-60',
                            )}
                        >
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                maxLength={CHAT_MAX_USER_MESSAGE_CHARS}
                                disabled={outOfMessages}
                                placeholder={
                                    outOfMessages
                                        ? 'Por hoy llegaste al límite de mensajes con este asistente'
                                        : isEmpty
                                          ? 'Contame en qué te ayudo…'
                                          : 'Escribí tu mensaje…'
                                }
                                aria-label="Mensaje"
                                className="max-h-[200px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
                            />
                            {isBusy ? (
                                <button
                                    type="button"
                                    onClick={() => stop()}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/10 text-foreground transition-colors hover:bg-foreground/15"
                                    aria-label="Detener respuesta"
                                    title="Detener"
                                >
                                    <Square className="h-4 w-4 fill-current" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || outOfMessages}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:bg-foreground/10 disabled:text-muted-foreground"
                                    aria-label="Enviar mensaje"
                                    title="Enviar"
                                >
                                    <ArrowUp className="h-5 w-5" />
                                </button>
                            )}
                        </form>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
                            <span>La IA puede equivocarse. No compartas claves ni datos bancarios.</span>
                            <span className="flex items-center gap-3">
                                {charsLeft < 300 && (
                                    <span className={cn(charsLeft < 50 && 'text-amber-700 dark:text-amber-400')}>{charsLeft} caracteres</span>
                                )}
                                {remaining !== null && (
                                    <span className={cn(remaining <= 1 && 'text-amber-700 dark:text-amber-400')}>
                                        {remaining === 0
                                            ? 'Sin mensajes por hoy'
                                            : `${remaining} de ${CHAT_DAILY_LIMIT} mensajes por hoy`}
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
