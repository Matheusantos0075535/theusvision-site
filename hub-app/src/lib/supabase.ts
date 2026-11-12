import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Para onde o link de confirmação do e-mail leva (a raiz do Hub, que sempre existe no GitHub Pages). */
export function urlDeRetorno() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}
