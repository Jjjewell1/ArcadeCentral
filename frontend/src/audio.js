let ctx = null
let sfxGain = null
let ambientGain = null
let muted = false

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    sfxGain = ctx.createGain()
    sfxGain.gain.value = muted ? 0 : 1
    sfxGain.connect(ctx.destination)
    ambientGain = ctx.createGain()
    ambientGain.gain.value = muted ? 0 : 0.15
    ambientGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, duration, type = 'square', gain = 0.15, delay = 0) {
  if (muted) return
  const ac = ensureCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ac.currentTime + delay)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration)
  osc.connect(g)
  g.connect(sfxGain)
  osc.start(ac.currentTime + delay)
  osc.stop(ac.currentTime + delay + duration)
}

export const sfx = {
  coin() {
    tone(1200, 0.5, 'square', 0.1)
    tone(1600, 0.6, 'square', 0.08, 0.05)
  },
  blip() {
    tone(880, 0.05, 'square', 0.05)
  },
  grab() {
    tone(440, 0.1, 'square', 0.15)
    tone(660, 0.1, 'square', 0.15, 0.1)
    tone(880, 0.2, 'square', 0.15, 0.2)
  },
  footstep() {
    tone(180, 0.15, 'sine', 0.06)
    tone(120, 0.2, 'sine', 0.05)
  },
  error() {
    tone(220, 0.3, 'sawtooth', 0.12)
    tone(160, 0.4, 'sawtooth', 0.1, 0.15)
  },
  setMuted(m) {
    muted = m
    if (ctx && sfxGain) sfxGain.gain.value = m ? 0 : 1
    if (ctx && ambientGain) ambientGain.gain.value = m ? 0 : 0.15
  },
  startAmbient() {
    if (muted) return
    const ac = ensureCtx()
    const lfo = ac.createOscillator()
    lfo.frequency.value = 0.15
    const lfoGain = ac.createGain()
    lfoGain.gain.value = 0.05
    lfo.connect(lfoGain)
    lfoGain.connect(ambientGain)
    lfo.start()
  },
}
