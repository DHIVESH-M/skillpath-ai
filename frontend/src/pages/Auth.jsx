import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Mascot from '../components/Mascot'
import { ErrorBox } from '../components/ui'
export default function Auth() {
  const [mode, setMode] = useState('in'), [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState('')
  const go = async e => { e.preventDefault(); setBusy(true); setErr(''); setNote('')
    const { data, error } = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password: pw }) : await supabase.auth.signUp({ email, password: pw })
    if (error) setErr(error.message); else if (mode === 'up' && !data.session) setNote('Check your email to confirm, then sign in!'); setBusy(false) }
  return <div className="min-h-screen grid md:grid-cols-2 items-center max-w-5xl mx-auto p-4 gap-4">
    <Mascot height={380} />
    <form onSubmit={go} className="card space-y-4">
      <h1 className="text-3xl font-black">Skill<span className="text-[#b58be6]">Path</span> AI</h1>
      <p className="font-bold text-ink/60">Your personal AI learning adventure ✨</p>
      <input className="input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="input" type="password" required minLength={6} placeholder="Password (6+ chars)" value={pw} onChange={e => setPw(e.target.value)} />
      <ErrorBox error={err} />{note && <div className="card !bg-mint font-bold">{note}</div>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
      <button type="button" className="w-full font-extrabold text-sm underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button>
    </form></div>
}
