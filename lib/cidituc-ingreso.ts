// Ida y vuelta del ingreso con CiDiTuc, vía Ciudad Digital (repo
// ditec-desarrollo/cidituc, src/routes/PrivateRoute.jsx, clave `hub-ia`).
//
// El contrato:
//   1. /auth/cidituc/login genera un `state`, lo guarda en una cookie httpOnly
//      corta y manda a
//      <CIDITUC_LOGIN_URL>/?ingreso=<al azar>#/login?next=<clave>&state=…
//      (Ciudad Digital usa rutas con #: sin el #, su pantalla de ingreso no ve
//      el next). El ?ingreso= cambia en cada pedido: Ciudad Digital se sirve sin
//      Cache-Control y el navegador puede seguir usando una versión vieja días
//      después de cada publicación.
//   2. Ciudad Digital pide CUIL y clave y vuelve a
//      /auth/cidituc/callback?auth=<JWT>&state=…
//   3. El callback compara el state con la cookie (protección CSRF: que la
//      vuelta sea del mismo navegador que pidió el ingreso) y sigue como antes:
//      verifica el JWT, abre la sesión del usuario-sombra, etc.
//
// Solo corre en los route handlers (runtime Node): usa node:crypto. No lo
// importes desde el middleware (Edge); para eso está lib/cidituc.ts.

import { randomBytes, timingSafeEqual } from 'node:crypto'

export const CIDITUC_STATE_COOKIE = 'hubia_cidituc_state'

// Lo que tiene la persona para escribir CUIL y clave en Ciudad Digital
export const CIDITUC_STATE_MAX_AGE_S = 10 * 60

export interface ConfigIngresoCidituc {
  loginUrl: string // sin barra ni # al final
  nextKey: string
}

// Sin configurar no hay ingreso con CiDiTuc: el botón vuelve con un error.
export function leerConfigIngreso(env: NodeJS.ProcessEnv = process.env): ConfigIngresoCidituc | null {
  // Con o sin el # de las rutas de Ciudad Digital: el # lo pone urlDeIngreso()
  const loginUrl = env.CIDITUC_LOGIN_URL?.trim().replace(/[/#]+$/, '')
  const nextKey = env.CIDITUC_NEXT_KEY?.trim()
  if (!loginUrl || !nextKey) return null
  return { loginUrl, nextKey }
}

export const nuevoState = () => randomBytes(32).toString('base64url')

// La pantalla de ingreso de Ciudad Digital para hub-ia (ver el contrato, arriba)
export const urlDeIngreso = (
  config: ConfigIngresoCidituc,
  state: string,
  ingreso = randomBytes(6).toString('base64url')
) =>
  `${config.loginUrl}/?ingreso=${encodeURIComponent(ingreso)}` +
  `#/login?next=${encodeURIComponent(config.nextKey)}&state=${encodeURIComponent(state)}`

// El state que volvió de Ciudad Digital ¿es el que guardamos en la cookie?
export function stateCoincide(recibido: string | null, guardado: string | undefined): boolean {
  if (!recibido || !guardado) return false
  const a = Buffer.from(recibido)
  const b = Buffer.from(guardado)
  return a.length === b.length && timingSafeEqual(a, b)
}
