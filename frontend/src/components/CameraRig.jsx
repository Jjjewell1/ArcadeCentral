import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function CameraRig({ zonePositions, activeZone, onZoneChange }) {
  const currentTarget = useRef(new THREE.Vector3(...zonePositions.home))
  const previousZone = useRef('home')
  const { camera } = useThree()

  // Jump straight to start position on mount
  useEffect(() => {
    const start = new THREE.Vector3(...zonePositions.home)
    camera.position.copy(start)
    camera.lookAt(0, 1.2, start.z - 2)
    currentTarget.current.copy(start)
  }, [camera, zonePositions])

  useFrame((_, delta) => {
    const target = zonePositions[activeZone]
    if (!target) return

    const t = new THREE.Vector3(...target)
    if (previousZone.current !== activeZone) {
      previousZone.current = activeZone
      onZoneChange && onZoneChange()
    }

    // Eased lerp toward the target position
    const speed = 1 - Math.pow(0.0001, delta)
    currentTarget.current.lerp(t, Math.min(1, speed * 1.5))
    camera.position.copy(currentTarget.current)

    // Look slightly ahead down the aisle
    const lookTarget = new THREE.Vector3(0, 1.2, currentTarget.current.z - 3)
    camera.lookAt(lookTarget)
  })

  return null
}
