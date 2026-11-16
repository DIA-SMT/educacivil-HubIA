# Hub IA (EducaCivil)

Plataforma de formación ciudadana en IA de la Dirección de Inteligencia Artificial de la
Municipalidad de San Miguel de Tucumán: cursos, aula con video, certificados y asistentes.
Next.js + Supabase, publicada en https://hub-ia.smt.gob.ar.

```bash
npm install
npm run dev
```

Las variables van en `.env.local` (no se sube al repo). Las de Supabase y OpenRouter son las de
siempre; las del ingreso con CiDiTuc están explicadas en `.env.cidituc.example`. El SQL de la base
está en `supabase/` y la guía para cargar cursos, en `docs/`.

## Ingreso con CiDiTuc

Los vecinos entran solo con su cuenta CiDiTuc (CUIL y clave) por **Ciudad Digital**
(https://ciudaddigital.smt.gob.ar, repo `ditec-desarrollo/cidituc`), donde hub-ia está registrado
con la clave **`hub-ia`** (`src/routes/PrivateRoute.jsx`, `CALLBACK_HUB_IA`). Los administradores
siguen entrando por `/login` con mail y contraseña.

1. «Ingresar con CiDiTuc» (`/signin`) lleva a `/auth/cidituc/login`, que guarda un `state` de un
   solo uso en una cookie httpOnly de 10 minutos y manda a
   `<CIDITUC_LOGIN_URL>/?ingreso=<al azar>#/login?next=hub-ia&state=…`.
   El `?ingreso=` cambia en cada pedido para que el navegador no use una versión vieja de Ciudad
   Digital (se sirve sin `Cache-Control`).
2. Ciudad Digital pide CUIL y clave y vuelve a `/auth/cidituc/callback?auth=<JWT>&state=…`.
3. El callback compara el `state` con la cookie, verifica la firma del JWT con
   `CIDITUC_JWT_SECRET` (el backend municipal sirve una cadena TLS incompleta, así que no depende
   de llamarlo), trae nombre y DNI de `/usuarios/authStatus` si puede, abre la sesión de Supabase
   del usuario-sombra de esa persona y prellena su perfil para el certificado.

La ida está en `lib/cidituc-ingreso.ts` y `app/auth/cidituc/login/route.ts`; la vuelta, en
`app/auth/cidituc/callback/route.ts` y `lib/cidituc-*.ts`.

Hasta noviembre de 2026 el botón armaba la dirección en el navegador con
`NEXT_PUBLIC_CIDITUC_LOGIN_URL`, que ya no se usa.

### Probar en local

1. En el repo `cidituc`, en su `.env.local`:
   `VITE_APP_HUB_IA_CALLBACK_URL=http://localhost:3000/auth/cidituc/callback`, y `npm run dev`.
2. Acá, en `.env.local`: `CIDITUC_LOGIN_URL=http://localhost:5173` (el puerto que muestre Vite) y
   `CIDITUC_NEXT_KEY=hub-ia`, y `npm run dev`.
3. Abrir http://localhost:3000/signin y tocar «Ingresar con CiDiTuc».
