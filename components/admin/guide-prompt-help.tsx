import { buildBaseStylePrompt } from '@/lib/ai-guides/system-prompt'

/**
 * Ayuda para quien carga el prompt de un asistente: explica qué se suma solo
 * y muestra la base común tal como la recibe el modelo.
 */
export function GuidePromptHelp({ title }: { title?: string }) {
    const base = buildBaseStylePrompt(title?.trim() || '[nombre del asistente]')

    return (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            <p>
                Acá va solo la <strong className="text-foreground">especialidad</strong> del asistente: qué sabe, qué personaje
                tiene, cómo encara las consultas de su tema y qué datos de Tucumán conviene que tenga en cuenta.
            </p>
            <p>
                El tono general (voseo, respuestas cortas y naturales, no inventar datos, no pedir claves, contexto tucumano)
                ya lo pone Hub IA para todos los asistentes, así que no hace falta repetirlo. El largo de los mensajes también se
                controla aparte.
            </p>
            <details className="group">
                <summary className="cursor-pointer select-none font-medium text-foreground/80 hover:text-foreground">
                    Ver la base común que se suma a este prompt
                </summary>
                <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-border/60 bg-background/60 p-3 font-mono text-xs leading-relaxed">
                    {base}
                </pre>
            </details>
        </div>
    )
}
