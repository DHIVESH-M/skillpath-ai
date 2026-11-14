import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../App'
import { Loader, ErrorBox } from '../components/ui'
export default function Assess() {
  const { me, refresh } = useApp(), [sp] = useSearchParams(), [quiz, setQuiz] = useState(null), [i, setI] = useState(0), [ans, setAns] = useState([]), [sel, setSel] = useState(null), [res, setRes] = useState(null), [busy, setBusy] = useState(''), [err, setErr] = useState('')
  const start = async skill => { setBusy('Generating your quiz…'); setErr(''); setRes(null); try { const q = await api(`/quiz/${encodeURIComponent(skill)}`); setQuiz(q); setI(0); setAns([]); setSel(null) } catch (e) { setErr(e.message) } setBusy('') }
  const next = async () => { const a = [...ans, sel]; setAns(a); setSel(null)
    if (i + 1 < quiz.questions.length) return setI(i + 1)
    setBusy('Assessment Evaluator is grading…'); try { setRes(await api('/quiz/submit', { skill: quiz.skill, questions: quiz.questions, answers: a })); await refresh() } catch (e) { setErr(e.message) } setBusy('') }
  if (busy) return <Loader text={busy} />
  const skills = Object.keys(me.skills), pre = sp.get('skill')
  if (res) return <div className="card text-center space-y-3 !bg-lavender"><div className="text-6xl">{res.score >= 80 ? '🎉' : res.score >= 60 ? '👍' : '💪'}</div><h2 className="text-3xl font-black">{res.score}%</h2><p className="font-bold">{res.feedback}</p>
    <p className="font-extrabold">+{res.xp} XP · {quiz.skill} level is now {res.new_level}</p>{res.adapted && <p className="card !bg-cream font-bold">🔁 I added a review quest to your roadmap.</p>}{res.new_achievements.length > 0 && <p className="font-extrabold">🏆 New badge unlocked!</p>}
    <button className="btn btn-mint" onClick={() => { setQuiz(null); setRes(null) }}>Another quiz</button></div>
  if (quiz) { const q = quiz.questions[i]; return <div className="space-y-4"><div className="bar"><div style={{ width: `${(100 * i) / quiz.questions.length}%` }} /></div><ErrorBox error={err} />
    <div className="card"><div className="text-xs font-extrabold text-ink/50">{quiz.skill} · {i + 1}/{quiz.questions.length}</div><h2 className="text-2xl font-black my-3">{q.q}</h2>
      <div className="space-y-2">{q.options.map((o, k) => <button key={k} onClick={() => setSel(k)} className={`btn w-full !justify-start !normal-case ${sel === k ? 'btn-primary' : 'bg-white'}`}>{o}</button>)}</div></div>
    <button className="btn btn-mint w-full" disabled={sel === null} onClick={next}>{i + 1 === quiz.questions.length ? 'Finish' : 'Check & next'}</button></div> }
  return <div className="space-y-4"><h1 className="text-3xl font-black">Pick a skill to test 🧪</h1><ErrorBox error={err} />{pre && <button className="btn btn-pink" onClick={() => start(pre)}>Start suggested: {pre}</button>}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{skills.map(s => <button key={s} onClick={() => start(s)} className="card text-left font-extrabold hover:-translate-y-1 transition">{s}<div className="bar mt-2"><div style={{ width: `${me.skills[s]}%` }} /></div></button>)}</div></div>
}
