import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import Layout from './components/Layout'
import { Loader, ErrorBox } from './components/ui'
import Auth from './pages/Auth'; import Onboarding from './pages/Onboarding'; import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'; import Assess from './pages/Assess'; import Mentor from './pages/Mentor'
const Ctx = createContext(); export const useApp = () => useContext(Ctx)
export default function App() {
  const [session, setSession] = useState(undefined), [me, setMe] = useState(null), [err, setErr] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_, s) => setSession(s)); return () => data.subscription.unsubscribe() }, [])
  const refresh = useCallback(async () => { try { setErr(''); setMe(await api('/me')) } catch (e) { setErr(e.message) } }, [])
  useEffect(() => { if (session) refresh(); else setMe(null) }, [session, refresh])
  if (session === undefined) return <Loader text="Loading…" />
  if (!session) return <Auth />
  if (err && !me) return <div className="p-6 max-w-lg mx-auto"><ErrorBox error={err} retry={refresh} /></div>
  if (!me) return <Loader text="Waking up Pip…" />
  const onboarded = !!me.roadmap
  return <Ctx.Provider value={{ me, refresh, session }}>
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={onboarded ? <Layout /> : <Navigate to="/onboarding" />}>
        <Route index element={<Dashboard />} /><Route path="roadmap" element={<Roadmap />} /><Route path="assess" element={<Assess />} /><Route path="mentor" element={<Mentor />} />
      </Route><Route path="*" element={<Navigate to="/" />} />
    </Routes></Ctx.Provider>
}
