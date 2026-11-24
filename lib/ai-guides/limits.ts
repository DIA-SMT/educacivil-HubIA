/** Límites del chat, compartidos entre la API y la interfaz. */
export const CHAT_DAILY_LIMIT = 6
export const CHAT_MAX_USER_MESSAGE_CHARS = 2000
/** Cuántos mensajes de la charla se mandan al modelo (los más recientes). */
export const CHAT_HISTORY_WINDOW = 20

export interface ChatMessageMetadata {
    /** Mensajes que le quedan hoy a la persona con este asistente. */
    remaining?: number
}

export type ChatErrorCode = 'unauthorized' | 'bad_request' | 'too_long' | 'not_found' | 'rate_limit' | 'server_error'

/** Cuerpo de las respuestas de error de /api/chat. */
export interface ChatErrorBody {
    code: ChatErrorCode
    message: string
}
