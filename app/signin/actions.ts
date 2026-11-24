'use server'

// El ingreso público es solo con CiDiTuc (app/auth/cidituc/*): acá ya no hay
// login con Google ni registro con mail y contraseña.

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const full_name = formData.get('full_name') as string

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    redirect('/onboarding?error=save_error')
  }

  redirect('/')
}
