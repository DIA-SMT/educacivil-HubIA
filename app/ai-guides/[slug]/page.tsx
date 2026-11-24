import { notFound } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { AiChatInterface } from '@/components/ai-guides/ai-chat-interface'
import { supabase } from '@/lib/supabase'
import { createClient } from '@/utils/supabase/server'
import { CHAT_DAILY_LIMIT } from '@/lib/ai-guides/limits'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { data: guides } = await supabase.from('ai_guides').select('slug')
  return (guides || []).map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { data: guide } = await supabase
    .from('ai_guides')
    .select('title, objective')
    .eq('slug', slug)
    .single()

  if (!guide) return {}
  return {
    title: `${guide.title} — Asistente IA | Hub IA`,
    description: guide.objective,
  }
}

export default async function AiGuideDetailPage({ params }: Props) {
  const { slug } = await params

  const [{ data: guide }, { data: allGuides }] = await Promise.all([
    supabase
      .from('ai_guides')
      .select('id, slug, title, objective, category')
      .eq('slug', slug)
      .single(),
    supabase
      .from('ai_guides')
      .select('id, slug, title, category')
      .order('created_at', { ascending: true }),
  ])

  if (!guide) notFound()

  // Registrar el uso y calcular cuántos mensajes le quedan hoy (no bloquea si falla)
  let initialRemaining: number | null = null
  try {
    const serverSupabase = await createClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    if (user) {
      const today = new Date().toISOString().slice(0, 10) // el contador usa current_date (UTC) en Supabase
      const [, { data: usage }] = await Promise.all([
        serverSupabase.from('assistant_usage').insert({
          user_id: user.id,
          assistant_slug: slug,
          assistant_title: guide.title,
        }),
        serverSupabase
          .from('chat_rate_limit')
          .select('count')
          .eq('user_id', user.id)
          .eq('guide_id', guide.id)
          .eq('day', today)
          .maybeSingle(),
      ])
      initialRemaining = Math.max(0, CHAT_DAILY_LIMIT - (usage?.count ?? 0))
    }
  } catch {
    // No es crítico: el contador se actualiza con la primera respuesta.
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16">
        <AiChatInterface guide={guide} allGuides={allGuides || []} initialRemaining={initialRemaining} />
      </main>
    </div>
  )
}
