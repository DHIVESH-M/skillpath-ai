import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, Html, Sparkles, Float } from '@react-three/drei'
import * as THREE from 'three'
export default function Roadmap3D({ steps = [], height = 260 }) {
  const pts = useMemo(() => steps.map((_, i) => new THREE.Vector3((i - (steps.length - 1) / 2) * 1.6, Math.sin(i * 1.1) * 0.9, 0)), [steps.length])
  const cur = Math.max(0, steps.findIndex(s => !s.done)); const idx = steps.every(s => s.done) ? steps.length - 1 : cur
  if (!steps.length) return null
  return (
    <div style={{ height }}><Canvas camera={{ position: [0, 0, Math.max(6, steps.length * 1.2)], fov: 50 }}>
      <ambientLight intensity={1} /><directionalLight position={[2, 4, 5]} />
      {pts.length > 1 && <Line points={new THREE.CatmullRomCurve3(pts).getPoints(60)} color="#c9a8ee" lineWidth={4} dashed dashSize={0.2} gapSize={0.15} />}
      {steps.map((s, i) => (
        <group key={s.id} position={pts[i]}>
          <mesh scale={i === idx ? 1.25 : 1}><sphereGeometry args={[0.32, 32, 32]} /><meshStandardMaterial color={s.done ? '#9fdca6' : i === idx ? '#FFD6E8' : '#ffffff'} /></mesh>
          <Html position={[0, -0.65, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}><div className="text-[11px] font-extrabold bg-white/90 rounded-full px-2 border border-ink/10 whitespace-nowrap">{s.done ? '✓ ' : ''}{s.skill}</div></Html>
        </group>))}
      <Walker target={pts[idx]} />
      <Sparkles count={30} scale={[steps.length * 1.7, 3, 2]} size={3} color="#d9b8f5" />
    </Canvas></div>)
}
function Walker({ target }) {
  const r = useRef()
  useFrame(({ clock }) => { r.current.position.lerp(new THREE.Vector3(target.x, target.y + 0.75 + Math.sin(clock.elapsedTime * 4) * 0.08, 0), 0.06) })
  return <mesh ref={r}><coneGeometry args={[0.18, 0.35, 16]} /><meshStandardMaterial color="#20212A" /></mesh>
}
