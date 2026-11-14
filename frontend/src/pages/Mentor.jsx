import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import Mascot from '../components/Mascot'
import { ErrorBox } from '../components/ui'
export default function Mentor() {
  const [msgs, setMsgs] = useState([]), [text, setText] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [trace, setTrace] = useState([]), end = useRef(), nav = useNavigate()
  useEffect(() => { api('/mentor/history').then(setMsgs).catch(e => setErr(e.message)) }, [])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])
  const send = async e => { e.preventDefault(); const t = text.trim(); if (!t) return; setText(''); setErr(''); setBusy(true); setMsgs(m => [...m, { role: 'user', content: t }])
    try { const r = await api('/mentor', { message: t }); setMsgs(m => [...m, { role: 'assistant', content: r.reply, action: r.action }]); setTrace(r.trace) } catch (e) { setErr(e.message) } setBusy(false) }
  const act = a => a.type === 'quiz' ? nav(`/assess?skill=${encodeURIComponent(a.skill)}`) : nav('/roadmap')
  return <div className="space-y-3"><Mascot height={180} objects={false} /><div className="card h-[45vh] overflow-y-auto space-y-3">
    {!msgs.length && <p className="font-bold text-ink/60">Ask Pip anything: “What should I learn next?”, “Quiz me!”, “How am I doing?”</p>}
    {msgs.map((m, i) => <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2 font-bold ${m.role === 'user' ? 'ml-auto bg-lavender' : 'bg-mint'}`}>{m.content}{m.action && <button className="btn btn-pink !py-1 mt-2 block" onClick={() => act(m.action)}>{m.action.type === 'quiz' ? `Quiz: ${m.action.skill}` : 'Open roadmap'}</button>}</div>)}
    {busy && <div className="bg-mint rounded-2xl px-4 py-2 font-bold w-24 animate-pulse">typing…</div>}<div ref={end} /></div>
    <ErrorBox error={err} />
    {trace.length > 0 && <p className="text-xs font-bold text-ink/50">Agent flow: {trace.map(t => t.agent).join(' → ')} → Orchestrator</p>}
    <form onSubmit={send} className="flex gap-2"><input className="input" placeholder="Message Pip…" value={text} onChange={e => setText(e.target.value)} /><button className="btn btn-primary" disabled={busy}>Send</button></form></div>
}
