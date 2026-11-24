import Link from 'next/link'
import { ArrowRight, MessagesSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getGuideMeta } from '@/lib/ai-guides/meta'
import { cn } from '@/lib/utils'

export async function AiGuidesGrid() {
  const { data: guides } = await supabase
    .from('ai_guides')
    .select('id, slug, title, objective, category')
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Encabezado */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <MessagesSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Asistentes ciudadanIA
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-balance mb-3">
          Charlá con la IA y resolvé cosas de{' '}
          <span className="neon-text">todos los días</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed text-pretty">
          Asistentes de inteligencia artificial pensados para la vida en Tucumán. Cada uno sabe de un tema y te responde
          como alguien de acá: sin vueltas, en criollo y con ganas de dar una mano.
        </p>
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(guides || []).map((guide) => {
          const meta = getGuideMeta(guide)
          const Icon = meta.icon
          return (
            <Link
              key={guide.id}
              href={`/ai-guides/${guide.slug}`}
              className="group glass rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-shadow',
                    meta.accent.soft,
                    meta.accent.border,
                    meta.accent.text,
                    meta.accent.glowOnHover,
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold border',
                    meta.accent.soft,
                    meta.accent.border,
                    meta.accent.text,
                  )}
                >
                  {guide.category}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                  {guide.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{guide.objective}</p>
              </div>

              {meta.starters[0] && (
                <p className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground italic line-clamp-2">
                  “{meta.starters[0]}”
                </p>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-border">
                <span className="flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2.5 transition-all">
                  Empezar a charlar
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
