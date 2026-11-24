import {
    Bot,
    ChefHat,
    Landmark,
    PiggyBank,
    Scale,
    ShieldAlert,
    Vote,
    type LucideIcon,
} from 'lucide-react'

/**
 * Datos de presentación de cada asistente (ícono, color, saludo, sugerencias).
 * El "cerebro" de cada uno sigue viviendo en Supabase (`ai_guides.system_prompt`);
 * acá solo está lo visual y el arranque de la charla. Los asistentes que se carguen
 * desde el admin y no estén en este mapa usan `fallbackMeta`.
 */

export interface GuideAccent {
    /** Color de texto/ícono. */
    text: string
    /** Fondo suave para chips e íconos. */
    soft: string
    /** Borde. */
    border: string
    /** Resplandor para el avatar grande. */
    glow: string
    /** El mismo resplandor, al pasar el mouse por una tarjeta (group). */
    glowOnHover: string
}

export interface GuideMeta {
    icon: LucideIcon
    accent: GuideAccent
    /** Saludo inicial (markdown). */
    greeting: string
    /** Preguntas para arrancar la charla con un clic. */
    starters: string[]
    /** Frases que se muestran mientras el asistente piensa. */
    thinking: string[]
}

const ACCENTS = {
    violet: {
        text: 'text-violet-700 dark:text-violet-300',
        soft: 'bg-violet-500/10',
        border: 'border-violet-400/30',
        glow: 'shadow-[0_0_32px_rgba(139,92,246,0.35)]',
        glowOnHover: 'group-hover:shadow-[0_0_32px_rgba(139,92,246,0.35)]',
    },
    orange: {
        text: 'text-orange-700 dark:text-orange-300',
        soft: 'bg-orange-500/10',
        border: 'border-orange-400/30',
        glow: 'shadow-[0_0_32px_rgba(249,115,22,0.35)]',
        glowOnHover: 'group-hover:shadow-[0_0_32px_rgba(249,115,22,0.35)]',
    },
    cyan: {
        text: 'text-cyan-700 dark:text-cyan-300',
        soft: 'bg-cyan-500/10',
        border: 'border-cyan-400/30',
        glow: 'shadow-[0_0_32px_rgba(34,211,238,0.35)]',
        glowOnHover: 'group-hover:shadow-[0_0_32px_rgba(34,211,238,0.35)]',
    },
    emerald: {
        text: 'text-emerald-700 dark:text-emerald-300',
        soft: 'bg-emerald-500/10',
        border: 'border-emerald-400/30',
        glow: 'shadow-[0_0_32px_rgba(16,185,129,0.35)]',
        glowOnHover: 'group-hover:shadow-[0_0_32px_rgba(16,185,129,0.35)]',
    },
    blue: {
        text: 'text-sky-700 dark:text-sky-300',
        soft: 'bg-sky-500/10',
        border: 'border-sky-400/30',
        glow: 'shadow-[0_0_32px_rgba(0,102,255,0.35)]',
        glowOnHover: 'group-hover:shadow-[0_0_32px_rgba(0,102,255,0.35)]',
    },
} satisfies Record<string, GuideAccent>

const GUIDE_META: Record<string, GuideMeta> = {
    'asesor-legal-ciudadano': {
        icon: Scale,
        accent: ACCENTS.violet,
        greeting:
            '¡Hola! Soy tu **Asesor Legal Ciudadano**. Te explico tus derechos sin vueltas y te ayudo a armar notas, reclamos o pedidos formales listos para presentar. ¿Qué te anda pasando?',
        starters: [
            'Quiero pedirle información pública a la Municipalidad, ¿cómo hago?',
            'Me cobran un servicio que nunca contraté, ¿qué puedo reclamar?',
            'Ayudame a redactar una nota para que arreglen el alumbrado de mi cuadra',
            'Me llegó una multa de tránsito que no reconozco, ¿qué hago?',
        ],
        thinking: ['Revisando la letra chica…', 'Buscando el artículo justo…', 'Ordenando los papeles…'],
    },
    'guia-de-cocina': {
        icon: ChefHat,
        accent: ACCENTS.orange,
        greeting:
            '¡Buenas! Soy tu **Asistente para la Cocina**. Contame qué tenés en la heladera y en la alacena y armamos algo rico, bien tucumano si se puede. ¿Qué hay para cocinar?',
        starters: [
            'Tengo papa, cebolla, huevos y un poco de queso',
            '¿Cómo hago empanadas tucumanas como las de la abuela?',
            'Me sobró arroz y pollo de ayer, ¿qué invento?',
            'Algo rápido y económico para 4 personas',
        ],
        thinking: ['Prendiendo el fuego…', 'Picando la cebolla…', 'Probando la sazón…'],
    },
    'analista-noticias': {
        icon: ShieldAlert,
        accent: ACCENTS.cyan,
        greeting:
            '¡Hola! Soy el **Detector de estafas electrónicas**. Pegame ese mensaje, mail o link que te dio mala espina y lo revisamos juntos antes de que toques nada. ¿Qué te llegó?',
        starters: [
            'Me llegó un SMS de que mi paquete está retenido y tengo que pagar para liberarlo',
            'Alguien que dice ser del banco me pide un código que me llegó por WhatsApp',
            'Un número desconocido dice ser mi hijo con celular nuevo y me pide plata',
            '¿Cómo me doy cuenta si un link es trucho?',
        ],
        thinking: ['Mirando con lupa…', 'Revisando el remitente…', 'Buscando el anzuelo…'],
    },
    'cuida-tu-bolsillo': {
        icon: PiggyBank,
        accent: ACCENTS.emerald,
        greeting:
            '¡Hola! Soy **Cuida tu bolsillo**. Te ayudo a entender las boletas de luz, gas, agua, internet o celular y a ver dónde se puede ahorrar. ¿Qué factura te está complicando?',
        starters: [
            'La boleta de luz me vino el doble que el mes pasado',
            '¿Qué son todos esos impuestos y cargos de la factura del gas?',
            'Pago mucho de internet y celular, ¿cómo bajo ese gasto?',
            'Tips para gastar menos luz en verano con el aire',
        ],
        thinking: ['Haciendo cuentas…', 'Revisando la boleta…', 'Buscando dónde ahorrar…'],
    },
}

function iconFromTitle(title: string): LucideIcon {
    const t = title.toLowerCase()
    if (t.includes('legal') || t.includes('derecho') || t.includes('asesor')) return Scale
    if (t.includes('estafa') || t.includes('fraude') || t.includes('noticia') || t.includes('fake')) return ShieldAlert
    if (t.includes('cocina') || t.includes('receta')) return ChefHat
    if (t.includes('bolsillo') || t.includes('gasto') || t.includes('finanza')) return PiggyBank
    if (t.includes('voto') || t.includes('elecci') || t.includes('democr')) return Vote
    if (t.includes('trámite') || t.includes('tramite') || t.includes('municip')) return Landmark
    return Bot
}

export function getGuideMeta(guide: { slug?: string | null; title: string; objective?: string | null }): GuideMeta {
    const known = guide.slug ? GUIDE_META[guide.slug] : undefined
    if (known) return known

    const objective = guide.objective?.trim().replace(/\.$/, '')
    return {
        icon: iconFromTitle(guide.title),
        accent: ACCENTS.blue,
        greeting: objective
            ? `¡Hola! Soy **${guide.title}**. ${objective.charAt(0).toUpperCase()}${objective.slice(1)}. ¿Por dónde arrancamos?`
            : `¡Hola! Soy **${guide.title}**. ¿En qué te doy una mano?`,
        starters: ['¿En qué me podés ayudar?', 'Dame un ejemplo de algo que puedas resolver'],
        thinking: ['Pensando…', 'Armando la respuesta…'],
    }
}
