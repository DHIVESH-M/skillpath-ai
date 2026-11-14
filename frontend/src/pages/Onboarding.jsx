import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../App'
import { Loader, ErrorBox } from '../components/ui'
import Mascot from '../components/Mascot'
const emoji = { 'Full-Stack Developer': '💻', 'Data Scientist': '📊', 'AI Engineer': '🧠', 'UX Designer': '🎨', 'Cybersecurity Analyst': '🛡️', 'Mobile Developer': '📱' }
export default function Onboarding() {
  const { me, refresh } = useApp(), nav = useNavigate()
  const [careers, setCareers] = useState(null), [goal, setGoal] = useState(''), [name, setName] = useState(me.profile.name || ''), [ratings, setRatings] = useState({}), [step, setStep] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  useEffect(() => { api('/careers').then(setCareers).catch(e => setErr(e.message)) }, [])
  const pick = g => { setGoal(g); setRatings(Object.fromEntries(careers[g].map(s => [s, 30]))) }
  const submit = async () => { setBusy(true); setErr(''); try { await api('/analyze', { name, goal, ratings }); await refresh(); nav('/') } catch (e) { setErr(e.message); setBusy(false) } }
  if (!careers) return err ? <div className="p-6"><ErrorBox error={err} /></div> : <Loader text="Loading careers…" />
  if (busy) return <div><Loader text="Skill Analyzer → Career Matcher → Learning Recommender are building your path…" /></div>
  return <div className="max-w-3xl mx-auto p-4 space-y-4">
    <Mascot height={200} objects={false} />
    <div className="flex gap-2">{[0, 1].map(i => <div key={i} className="bar flex-1"><div style={{ width: step >= i ? '100%' : '0' }} /></div>)}</div>
    <ErrorBox error={err} />
    {step === 0 ? <>
      <h2 className="text-2xl font-black">Hi! I'm Pip 👋 What should I call you, and what's your dream career?</h2>
      <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Object.keys(careers).map((c, i) => <button key={c} onClick={() => pick(c)} className={`card text-left font-extrabold hover:-translate-y-1 transition ${goal === c ? '!bg-lavender' : ['', '!bg-sky', '!bg-mint'][i % 3]}`}><div className="text-3xl">{emoji[c]}</div>{c}</button>)}</div>
      <button className="btn btn-mint w-full" disabled={!goal || !name.trim()} onClick={() => setStep(1)}>Continue</button></>
    : <>
      <h2 className="text-2xl font-black">Rate your current skills for {goal}</h2><p className="font-bold text-ink/60">Be honest — this powers your skill-gap analysis.</p>
      {Object.entries(ratings).map(([s, v]) => <div key={s} className="card !p-4"><div className="flex justify-between font-extrabold"><span>{s}</span><span>{v}/100</span></div>
        <input type="range" min="0" max="100" step="5" value={v} className="w-full accent-[#b58be6]" onChange={e => setRatings({ ...ratings, [s]: +e.target.value })} /></div>)}
      <div className="flex gap-3"><button className="btn btn-pink" onClick={() => setStep(0)}>Back</button><button className="btn btn-mint flex-1" onClick={submit}>Build my roadmap 🚀</button></div></>}
  </div>
}
