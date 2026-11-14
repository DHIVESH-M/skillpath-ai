import { supabase } from './supabase'
export async function api(path, body, method) {
  const { data } = await supabase.auth.getSession()
  const res = await fetch('/api' + path, { method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Request failed (${res.status})`) }
  return res.json()
}
