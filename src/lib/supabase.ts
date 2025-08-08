import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a fallback client for SSR
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables')
    // Return a dummy client that won't work but won't crash
    return createClient('https://dummy.supabase.co', 'dummy-key')
  }
  return createClient(supabaseUrl, supabaseKey)
}

export const supabase = createSupabaseClient() 