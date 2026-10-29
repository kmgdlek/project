import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// 잘못된 값(https:// 누락, 따옴표 포함 등)이어도 앱 전체가 죽지 않도록 방어
let client = null
try {
  if (/^https?:\/\//.test(url) && anonKey) client = createClient(url, anonKey)
} catch (e) {
  console.error('Supabase 초기화 실패:', e)
}

export const isSupabaseConfigured = Boolean(client)
export const supabase = client
