import { useEffect, useRef } from 'react'
import { sfx } from '../audio.js'

export default function AmbientAudio({ muted, enabled }) {
  const started = useRef(false)

  useEffect(() => {
    sfx.setMuted(muted)
  }, [muted])

  useEffect(() => {
    if (enabled && !started.current) {
      if (typeof window !== 'undefined') {
        const resume = () => {
          sfx.startAmbient()
          started.current = true
          window.removeEventListener('pointerdown', resume)
          window.removeEventListener('keydown', resume)
        }
        window.addEventListener('pointerdown', resume)
        window.addEventListener('keydown', resume)
      }
    }
  }, [enabled])

  return null
}
