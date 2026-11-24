import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { buildSystemPrompt } from '@/lib/ai-guides/system-prompt';
import {
    CHAT_DAILY_LIMIT,
    CHAT_HISTORY_WINDOW,
    CHAT_MAX_USER_MESSAGE_CHARS,
    type ChatErrorBody,
    type ChatMessageMetadata,
} from '@/lib/ai-guides/limits';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 30;

const MAX_OUTPUT_TOKENS = 1200;

function errorResponse(status: number, body: ChatErrorBody) {
    return Response.json(body, { status });
}

function extractLastUserText(messages: UIMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role !== 'user') continue;
        const parts: any[] = (m as any).parts ?? [];
        return parts
            .filter((p) => p?.type === 'text' && typeof p.text === 'string')
            .map((p) => p.text)
            .join('');
    }
    return '';
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return errorResponse(401, {
                code: 'unauthorized',
                message: 'Tu sesión se venció. Volvé a ingresar para seguir charlando.',
            });
        }

        const { messages, guideId }: { messages: UIMessage[]; guideId: string } = await req.json();
        if (!guideId || !Array.isArray(messages) || messages.length === 0) {
            return errorResponse(400, { code: 'bad_request', message: 'No pudimos leer tu mensaje. Probá de nuevo.' });
        }

        // 2. Validar tamaño del último mensaje del usuario
        const lastUserText = extractLastUserText(messages);
        if (lastUserText.length > CHAT_MAX_USER_MESSAGE_CHARS) {
            return errorResponse(413, {
                code: 'too_long',
                message: `Tu mensaje es muy largo: el máximo es de ${CHAT_MAX_USER_MESSAGE_CHARS} caracteres. Probá resumirlo o mandalo en partes.`,
            });
        }

        // 3. Cargar el asistente (y el resto, para poder sugerirlos)
        const [{ data: guide, error: guideErr }, { data: allGuides }] = await Promise.all([
            supabase.from('ai_guides').select('id, system_prompt, title').eq('id', guideId).single(),
            supabase.from('ai_guides').select('id, title').order('created_at', { ascending: true }),
        ]);

        if (guideErr || !guide) {
            return errorResponse(404, { code: 'not_found', message: 'No encontramos este asistente.' });
        }

        // 4. Rate limit atómico vía RPC (devuelve cuántos mensajes lleva hoy)
        const { data: usedToday, error: rpcErr } = await supabase.rpc('increment_chat_usage', {
            p_guide_id: guide.id,
            p_limit: CHAT_DAILY_LIMIT,
        });
        if (rpcErr) {
            if (rpcErr.code === 'P0001') {
                return errorResponse(429, {
                    code: 'rate_limit',
                    message: `Llegaste al límite de ${CHAT_DAILY_LIMIT} mensajes por día con este asistente. Mañana seguimos.`,
                });
            }
            console.error('Rate limit RPC error:', rpcErr);
            return errorResponse(500, {
                code: 'server_error',
                message: 'Tuvimos un problema de nuestro lado. Probá de nuevo en un ratito.',
            });
        }
        const remaining = typeof usedToday === 'number' ? Math.max(0, CHAT_DAILY_LIMIT - usedToday) : undefined;

        // 5. Llamar al modelo
        const system = buildSystemPrompt(guide, {
            otherGuides: (allGuides ?? []).filter((g) => g.id !== guide.id),
        });

        // Se manda solo el tramo más reciente de la charla para acotar costo y latencia.
        const recentMessages = messages.slice(-CHAT_HISTORY_WINDOW);
        const modelMessages = await convertToModelMessages(recentMessages);

        const result = streamText({
            model: openrouter(process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'),
            system,
            messages: modelMessages,
            temperature: 0.7,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        });

        return result.toUIMessageStreamResponse({
            messageMetadata: ({ part }): ChatMessageMetadata | undefined =>
                part.type === 'start' ? { remaining } : undefined,
            onError: (error) => {
                console.error('API Chat stream error:', error);
                return 'Se cortó la respuesta a mitad de camino. Probá de nuevo.';
            },
        });
    } catch (error) {
        console.error('API Chat Error:', error);
        return errorResponse(500, {
            code: 'server_error',
            message: 'Tuvimos un problema de nuestro lado. Probá de nuevo en un ratito.',
        });
    }
}
