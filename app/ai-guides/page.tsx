import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AiGuidesGrid } from '@/components/ai-guides/ai-guides-grid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Asistentes ciudadanIA — Hub IA',
  description: 'Charlá con asistentes de inteligencia artificial pensados para la vida en Tucumán: tus derechos, estafas digitales, gastos del hogar, cocina y más.',
}

export default function AiGuidesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <AiGuidesGrid />
      </main>
      <Footer />
    </div>
  )
}
