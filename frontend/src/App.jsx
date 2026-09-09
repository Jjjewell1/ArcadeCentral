import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Scene from './components/Scene.jsx'
import Navbar from './components/Navbar.jsx'
import CRTOverlay from './components/CRTOverlay.jsx'
import MarqueeTicker from './components/MarqueeTicker.jsx'
import AmbientAudio from './components/AmbientAudio.jsx'
import AttractMode from './components/AttractMode.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Library from './pages/Library.jsx'
import Downloads from './pages/Downloads.jsx'
import Settings from './pages/Settings.jsx'
import { CreditsProvider } from './hooks/useCredits.jsx'

export default function App() {
  const supportsWebGL2 = typeof document !== 'undefined' &&
    !!document.createElement('canvas').getContext('webgl2')
  const [lowEnd, setLowEnd] = useState(() =>
    localStorage.getItem('arcade-lowend') === '1' || !supportsWebGL2)
  const [muted, setMuted] = useState(() => localStorage.getItem('arcade-muted') === '1')

  const toggleLowEnd = () => {
    if (!supportsWebGL2) return
    const next = !lowEnd
    setLowEnd(next)
    localStorage.setItem('arcade-lowend', next ? '1' : '0')
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    localStorage.setItem('arcade-muted', next ? '1' : '0')
  }

  return (
    <CreditsProvider>
      <AmbientAudio muted={muted} enabled={!lowEnd} />
      {!lowEnd && <Scene />}
      <CRTOverlay />
      <Navbar lowEnd={lowEnd} onToggleMute={toggleMute} muted={muted} />
      <MarqueeTicker lowEnd={lowEnd} />
      {!lowEnd && <AttractMode />}
      <div className={`ui-layer ${lowEnd ? 'flat' : 'overlay'}`}>
        <Routes>
          <Route path="/" element={<Home lowEnd={lowEnd} />} />
          <Route path="/search" element={<Search lowEnd={lowEnd} />} />
          <Route path="/library" element={<Library lowEnd={lowEnd} />} />
          <Route path="/downloads" element={<Downloads lowEnd={lowEnd} />} />
          <Route path="/settings" element={<Settings lowEnd={lowEnd} onToggleLowEnd={toggleLowEnd} />} />
        </Routes>
      </div>
    </CreditsProvider>
  )
}
