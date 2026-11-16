import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/utils/url'
import {
  CIDITUC_STATE_COOKIE,
  CIDITUC_STATE_MAX_AGE_S,
  leerConfigIngreso,
  nuevoState,
  urlDeIngreso,
} from '@/lib/cidituc-ingreso'

// "Ingresar con CiDiTuc": state nuevo y a Ciudad Digital (ver lib/cidituc-ingreso.ts)
export async function GET() {
  const config = leerConfigIngreso()
  if (!config) {
    console.error('[cidituc] faltan CIDITUC_LOGIN_URL o CIDITUC_NEXT_KEY en el entorno')
    return NextResponse.redirect(`${await getBaseUrl()}/signin?error=cidituc_config`)
  }

  const state = nuevoState()
  const response = NextResponse.redirect(urlDeIngreso(config, state))
  // Nunca guardar esta respuesta: cada ingreso tiene su state y su ?ingreso=
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set(CIDITUC_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax: la vuelta de Ciudad Digital es una navegación de primer nivel (GET)
    sameSite: 'lax',
    path: '/auth/cidituc',
    maxAge: CIDITUC_STATE_MAX_AGE_S,
  })
  return response
}
