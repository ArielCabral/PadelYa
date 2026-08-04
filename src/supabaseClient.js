import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdlkrikkhejqyqidefshz.supabase.co'
const supabaseAnonKey = 'sb_publishable_gqCOAKQYCPgVEH1imauZYw_FBtwMu2n'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)