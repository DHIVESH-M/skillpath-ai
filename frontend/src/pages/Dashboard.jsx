import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useApp } from '../App'
import Mascot from '../components/Mascot'
import SkillViz from '../components/SkillViz'
export default function Dashboard() {
  const { me } = useApp(), { profile: p, skills, roadmap: r, achievements, attempts } = me, ref = useRef()
  const steps = r?.steps || [], done = steps.filter(s => s.done).length, next = steps.find(s => !s.done)
  useEffect(() => { gsap.from(ref.current.children, { y: 24, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }) }, [])
  return <div ref={ref} className="grid md:grid-cols-2 gap-4">
    <div className="card md:col-span-2 !bg-lavender flex flex-col md:flex-row items-center"><Mascot height={220} className="w-full md:w-1/3" /><div className="flex-1 space-y-2">
      <h1 className="text-3xl font-black">Hey {p.name}! 👋</h1><p className="font-bold">{r?.summary}</p>
      <div className="bar"><div style={{ width: `${steps.length ? (100 * done) / steps.length : 0}%` }} /></div><p className="text-sm font-extrabold">{done}/{steps.length} quests complete · Goal: {p.career_goal}</p></div></div>
    <div className="card !bg-cream"><h3 className="font-black text-lg">🎯 Daily quest</h3>
      {next ? <><p className="font-extrabold mt-2">{next.title}</p><p className="text-sm font-semibold text-ink/70">{next.description}</p><div className="flex gap-2 mt-3"><Link className="btn btn-mint" to="/roadmap">Go to quest</Link><Link className="btn btn-primary" to={`/assess?skill=${encodeURIComponent(next.skill)}`}>Quick quiz</Link></div></> : <p className="font-bold mt-2">All quests done! 🎉 Take quizzes to keep levelling up.</p>}</div>
    <div className="card"><h3 className="font-black text-lg">🧭 Career match</h3>{(r?.matches || []).map(m => <div key={m.career} className="mt-2"><div className="flex justify-between font-extrabold text-sm"><span>{m.career}</span><span>{m.match}%</span></div><div className="bar"><div style={{ width: `${m.match}%` }} /></div></div>)}</div>
    <div className="card md:col-span-2 !bg-sky"><h3 className="font-black text-lg">🧊 Your skill tower <span className="text-xs font-bold text-ink/60">(drag to rotate)</span></h3><SkillViz skills={skills} /></div>
    <div className="card"><h3 className="font-black text-lg">🏆 Achievements</h3>{achievements.length ? achievements.map(a => <div key={a.key} className="mt-2 font-bold text-sm bg-mint rounded-xl px-3 py-2">{a.label}</div>) : <p className="font-bold text-ink/60 mt-2">Complete quests to earn badges!</p>}</div>
    <div className="card"><h3 className="font-black text-lg">📈 Recent quizzes</h3>{attempts.length ? attempts.map((a, i) => <div key={i} className="flex justify-between mt-2 font-bold text-sm"><span>{a.skill}</span><span>{a.score}%</span></div>) : <p className="font-bold text-ink/60 mt-2">No quizzes yet.</p>}</div>
  </div>
}
