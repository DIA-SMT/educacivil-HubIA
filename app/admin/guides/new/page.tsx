import { createAiGuide } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { GuidePromptHelp } from '@/components/admin/guide-prompt-help'

export default function NewGuidePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear Nuevo Agente</h1>
                    <p className="text-muted-foreground mt-2">Configurá un nuevo asistente ciudadanIA para que charle con vecinas y vecinos.</p>
                </div>
                <Link href="/admin/guides">
                    <Button variant="outline">Volver</Button>
                </Link>
            </div>

            <form action={createAiGuide} className="space-y-8 bg-card p-8 rounded-xl border border-border/50">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Nombre del Agente</Label>
                        <Input id="title" name="title" placeholder="Ej: Asistente de Matemáticas" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Input id="category" name="category" placeholder="Ej: Análisis Matemático" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="objective">Objetivo / Descripción Corta</Label>
                    <Input id="objective" name="objective" placeholder="Ayuda a resolver problemas de cálculo integral" required />
                </div>

                <div className="space-y-3">
                    <Label htmlFor="system_prompt">System prompt: la especialidad del asistente</Label>
                    <GuidePromptHelp />
                    <Textarea
                        id="system_prompt"
                        name="system_prompt"
                        placeholder="Sos un guía que conoce al dedillo los trámites municipales de San Miguel de Tucumán..."
                        className="min-h-[300px] font-mono whitespace-pre-wrap"
                        required
                    />
                </div>

                <div className="pt-4 border-t border-border/50 flex gap-4">
                    <Button type="submit">Crear Agente</Button>
                    <Link href="/admin/guides">
                        <Button variant="ghost">Cancelar</Button>
                    </Link>
                </div>
            </form>
        </div>
    )
}
