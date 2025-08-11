import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string
export const supabaseAnon = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string
export const BUCKET = ((import.meta as any).env.VITE_SUPABASE_BUCKET as string) || 'attachments'

export const supabase = createClient(supabaseUrl, supabaseAnon)
