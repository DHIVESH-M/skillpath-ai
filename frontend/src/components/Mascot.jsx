import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import gsap from 'gsap'

function Pip({ mood = 'happy' }) {
  const g = useRef(), eyes = useRef([]), ant = useRef()
  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime
    g.current.rotation.y += (pointer.x * 0.6 - g.current.rotation.y) * 0.08
    g.current.rotation.x += (-pointer.y * 0.3 - g.current.rotation.x) * 0.08
    const blink = Math.sin(t * 1.7) > 0.985 ? 0.1 : 1
    eyes.current.forEach(e => e && (e.scale.y = blink))
    ant.current.rotation.z = Math.sin(t * 3) * 0.2
  })
  const hop = () => gsap.fromTo(g.current.position, { y: 0 }, { y: 0.7, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' })
  return (
    <Float speed={2} floatIntensity={0.6}>
      <group ref={g} onClick={hop} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <mesh scale={[1, 0.92, 1]}><sphereGeometry args={[1, 48, 48]} /><meshStandardMaterial color="#E9DDF8" roughness={0.35} /></mesh>
        {[-0.38, 0.38].map((x, i) => (<group key={i}>
          <mesh ref={el => (eyes.current[i] = el)} position={[x, 0.15, 0.88]} scale={[1, 1.3, 0.6]}><sphereGeometry args={[0.13, 24, 24]} /><meshStandardMaterial color="#20212A" /></mesh>
          <mesh position={[x * 1.15, -0.15, 0.85]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#FFD6E8" /></mesh>
          <mesh position={[x * 2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.28, 0.12, 16, 32]} /><meshStandardMaterial color="#DDF3DF" /></mesh></group>))}
        <mesh position={[0, -0.12, 0.93]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.2, 0.04, 12, 32, Math.PI]} /><meshStandardMaterial color="#20212A" /></mesh>
        <group ref={ant} position={[0, 0.9, 0]}><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.04, 0.04, 0.5]} /><meshStandardMaterial color="#20212A" /></mesh>
          <mesh position={[0, 0.58, 0]}><sphereGeometry args={[0.15, 24, 24]} /><meshStandardMaterial color="#FFD6E8" emissive="#FFD6E8" emissiveIntensity={0.5} /></mesh></group>
      </group>
    </Float>)
}
const shapes = [['ico', '#FFD6E8', [-2.4, 1.2, -0.5]], ['book', '#D9EEFF', [2.5, 1, -0.8]], ['ring', '#DDF3DF', [-2.2, -1.3, 0]],
  ['octa', '#FFF0D8', [2.3, -1.2, -0.3]], ['dodeca', '#E9DDF8', [0, 2.2, -1]]]
function Geo({ k }) {
  if (k === 'ico') return <icosahedronGeometry args={[0.35]} />
  if (k === 'book') return <boxGeometry args={[0.5, 0.65, 0.14]} />
  if (k === 'ring') return <torusGeometry args={[0.3, 0.12, 16, 32]} />
  if (k === 'octa') return <octahedronGeometry args={[0.38]} />
  return <dodecahedronGeometry args={[0.33]} />
}
export function FloatingObjects() {
  return shapes.map(([k, color, pos], i) => (
    <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={1.5} floatIntensity={1.2} position={pos}>
      <mesh><Geo k={k} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
    </Float>))
}
export default function Mascot({ height = 320, objects = true, className = '' }) {
  return (
    <div style={{ height }} className={className}>
      <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.9} /><directionalLight position={[3, 4, 5]} intensity={1.4} />
        <Pip />{objects && <FloatingObjects />}
        <Sparkles count={40} scale={7} size={3} speed={0.4} color="#d9b8f5" />
      </Canvas>
    </div>)
}
