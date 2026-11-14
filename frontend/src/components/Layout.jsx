import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useApp } from '../App'
import { supabase } from '../lib/supabase'
const links = [['/', '🏠', 'Home'], ['/roadmap', '🗺️', 'Roadmap'], ['/assess', '🧪', 'Quiz'], ['/mentor', '🤖', 'Mentor']]
export default function Layout() {
  const { me } = useApp(); const ref = useRef(); const p = me?.profile
  useEffect(() => { gsap.fromTo(ref.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }) }, [])
  return (<div className="min-h-screen pb-24 md:pb-6 md:pl-56">
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col gap-2 p-4 bg-white/70 backdrop-blur border-r-2 border-ink/10">
      <div className="text-2xl font-black mb-4">Skill<span className="text-[#b58be6]">Path</span> AI</div>
      {links.map(([to, e, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rounded-2xl px-4 py-3 font-extrabold ${isActive ? 'bg-lavender' : 'hover:bg-cream'}`}>{e} {l}</NavLink>)}
      <button className="btn btn-pink mt-auto" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </aside>
    <header className="flex items-center justify-between p-4 md:justify-end gap-3">
      <div className="md:hidden text-xl font-black">SkillPath AI</div>
      <div className="flex gap-2 font-extrabold"><span className="card !p-2 !px-4 !rounded-full">🔥 {p?.streak || 0}</span><span className="card !p-2 !px-4 !rounded-full">⭐ {p?.xp || 0} XP</span></div>
    </header>
    <main ref={ref} className="px-4 max-w-5xl mx-auto"><Outlet /></main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t-2 border-ink/10 flex justify-around p-2 z-10">
      {links.map(([to, e, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center text-xs font-extrabold px-3 py-1 rounded-2xl ${isActive ? 'bg-lavender' : ''}`}><span className="text-xl">{e}</span>{l}</NavLink>)}
    </nav></div>)
}
