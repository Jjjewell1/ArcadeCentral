import { useEffect, useRef, useState } from 'react'

const IDLE_MS = 45000

export default function AttractMode({ enabled = true }) {
  const [active, setActive] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const resetTimer = () => {
      setActive(false)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setActive(true), IDLE_MS)
    }

    const events = ['pointerdown', 'keydown', 'wheel']
    events.forEach((e) => window.addEventListener(e, resetTimer))

    const startTime = performance.now()
    const check = () => {
      const elapsed = performance.now() - startTime
      // Only trigger attract if no input since mount; resetTimer handles interrupts
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => setActive(true), IDLE_MS)
      }
    }
    check()

    return () => {
      clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [enabled])

  if (!active) return null

  return (
    <div
      className="attract-prompt"
      onClick={() => setActive(false)}
    >
      <div>INSERT COIN</div>
      <div style={{ fontSize: '10px', marginTop: '12px', color: '#00f0ff' }}>
        TO CONTINUE
      </div>
    </div>
  )
}
