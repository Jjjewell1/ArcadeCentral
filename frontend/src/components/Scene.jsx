import { Canvas, useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Float, Stars } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import CameraRig from './CameraRig.jsx'

function NeonTube({ position, rotation, color, length = 6 }) {
  const matRef = useRef()
  useFrame(() => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 1.2 + Math.sin(Date.now() * 0.01) * 0.3
    }
  })
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.08, 0.08]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
      />
    </mesh>
  )
}

function Floor() {
  const matRef = useRef()
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[40, 80]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a0a18"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <gridHelper args={[40, 40, '#00f0ff', '#200a40']} position={[0, 0.01, -6]} />
    </>
  )
}

function Cabinet({ position, color = '#00b0ff', setActiveZone }) {
  const screenMat = useRef()
  useFrame((state) => {
    if (screenMat.current) {
      const t = state.clock.elapsedTime
      screenMat.current.emissiveIntensity = 1.5 + Math.sin(t * 2 + position[2] * 3) * 0.5
    }
  })
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.6]} />
        <meshStandardMaterial color="#1a0b2a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 1.3, 0.32]} onClick={(e) => { e.stopPropagation(); setActiveZone && setActiveZone() }}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial
          ref={screenMat}
          color="#001820"
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Rim light strips */}
      <mesh position={[0.58, 0.8, 0]}>
        <boxGeometry args={[0.05, 1.4, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-0.58, 0.8, 0]}>
        <boxGeometry args={[0.05, 1.4, 0.02]} />
        <meshStandardMaterial color="#ff00e0" emissive="#ff00e0" emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}

function CabinetRow({ z, count = 4, color, setActiveZone }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <Cabinet
          key={i}
          position={[i * 1.6 - (count - 1) * 0.8, 0, z]}
          color={color}
          setActiveZone={setActiveZone}
        />
      ))}
    </group>
  )
}

function MarqueeWall() {
  return (
    <group position={[0, 0, -16]}>
      <mesh>
        <boxGeometry args={[16, 3, 0.5]} />
        <meshStandardMaterial color="#12082a" emissive="#ff00e0" emissiveIntensity={0.2} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <Float key={i} speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={[-6.5 + i * 1.85, 0.4, 0.35]}>
            <boxGeometry args={[1.3, 0.5, 0.1]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#00f0ff' : '#ff00e0'}
              emissive={i % 2 === 0 ? '#00f0ff' : '#ff00e0'}
              emissiveIntensity={1.8}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function AisleParticles() {
  const points = useMemo(() => {
    const positions = new Float32Array(300 * 3)
    for (let i = 0; i < 300; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = Math.random() * 4
      positions[i * 3 + 2] = -Math.random() * 40
    }
    return positions
  }, [])
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(points, 3))
    return g
  }, [points])
  const mat = useMemo(() => new THREE.PointsMaterial({ color: '#00f0ff', size: 0.03, transparent: true, opacity: 0.6 }), [])
  return <points geometry={geom} material={mat} />
}

export default function Scene({ activeZone, setActiveZone, onZoneChange }) {
  const zonePositions = useMemo(() => ({
    home: [0, 1.6, -4],
    search: [0, 1.6, -10],
    library: [0, 1.6, -18],
    downloads: [0, 1.6, -26],
    player: [0, 1.6, -32],
  }), [])

  return (
    <div className="scene-layer">
      <Canvas
        camera={{ fov: 70, position: [0, 1.6, 4] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#05001a']} />
        <fog attach="fog" args={['#05001a', 6, 34]} />

        <ambientLight intensity={0.15} />
        {/* Cyan rim from one side */}
        <pointLight position={[6, 3, 0]} intensity={0.8} color="#00f0ff" />
        {/* Magenta rim from the other */}
        <pointLight position={[-6, 3, -4]} intensity={0.8} color="#ff00e0" />
        {/* Center fill */}
        <directionalLight position={[0, 4, 2]} intensity={0.4} color="#ffffff" />
        {/* Warm pool under signage */}
        <pointLight position={[0, 0.2, -15]} intensity={0.6} color="#ffe600" distance={8} />

        <Floor />
        <MarqueeWall />
        <AisleParticles />

        <Stars radius={40} depth={30} count={800} factor={2} saturation={1} fade speed={1} />

        {/* Zone cabinets */}
        <group>
          <CabinetRow z={-5} color="#ff00e0" setActiveZone={() => setActiveZone('search')} />
          <CabinetRow z={-9} count={5} color="#00f0ff" setActiveZone={() => setActiveZone('library')} />
          <CabinetRow z={-14} count={6} color="#ffe600" setActiveZone={() => setActiveZone('downloads')} />
          <CabinetRow z={-20} count={3} color="#00ff88" setActiveZone={() => setActiveZone('player')} />
        </group>

        {/* Hanging neon signage */}
        <NeonTube position={[0, 3.2, -5]} rotation={[0, 0, 0]} color="#ff00e0" length={8} />
        <NeonTube position={[0, 3.2, -9]} rotation={[0, 0, 0]} color="#00f0ff" length={8} />
        <NeonTube position={[0, 3.2, -14]} rotation={[0, 0, 0]} color="#ffe600" length={8} />
        <NeonTube position={[0, 3.2, -20]} rotation={[0, 0, 0]} color="#00ff88" length={8} />

        <CameraRig zonePositions={zonePositions} activeZone={activeZone} onZoneChange={onZoneChange} />

        <EffectComposer>
          <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          <ChromaticAberration offset={[0.0005, 0.0005]} radialModulation modulationOffset={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={0.9} />
          <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.08} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
