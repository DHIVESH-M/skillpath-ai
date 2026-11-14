import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
const COLORS = ['#FFD6E8', '#D9EEFF', '#DDF3DF', '#E9DDF8', '#FFF0D8']
function Bar({ skill, level, i, n, onHover }) {
  const m = useRef(); const a = (i / n) * Math.PI * 2; const [h, setH] = useState(false)
  useFrame(() => { const t = Math.max(level / 50, 0.1); m.current.scale.y += (t - m.current.scale.y) * 0.06; m.current.position.y = m.current.scale.y / 2 })
  return (
    <group position={[Math.cos(a) * 2, 0, Math.sin(a) * 2]}>
      <mesh ref={m} scale={[1, 0.1, 1]} onPointerOver={() => { setH(true); onHover(skill) }} onPointerOut={() => setH(false)}>
        <cylinderGeometry args={[0.35, 0.35, 1, 24]} /><meshStandardMaterial color={COLORS[i % 5]} emissive={h ? '#ffffff' : '#000'} emissiveIntensity={0.3} /></mesh>
      <Html position={[0, Math.max(level / 50, 0.1) + 0.35, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="bg-white/90 rounded-full px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap border border-ink/10">{skill} · {level}</div></Html>
    </group>)
}
export default function SkillViz({ skills = {}, height = 340 }) {
  const e = Object.entries(skills)
  if (!e.length) return <div className="grid place-items-center text-ink/50 font-bold" style={{ height }}>No skills yet — finish onboarding</div>
  return (
    <div style={{ height }}><Canvas camera={{ position: [0, 3.5, 6], fov: 45 }}>
      <ambientLight intensity={1} /><directionalLight position={[4, 6, 3]} intensity={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.2, 48]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {e.map(([s, l], i) => <Bar key={s} skill={s} level={l} i={i} n={e.length} onHover={() => {}} />)}
      <OrbitControls autoRotate autoRotateSpeed={1.2} enablePan={false} minPolarAngle={0.6} maxPolarAngle={1.4} />
    </Canvas></div>)
}
