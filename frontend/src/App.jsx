import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import MarqueeTicker from './components/MarqueeTicker.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Library from './pages/Library.jsx'
import Downloads from './pages/Downloads.jsx'
import Settings from './pages/Settings.jsx'
import { CreditsProvider } from './hooks/useCredits.jsx'

export default function App() {
  const [muted, setMuted] = useState(() => localStorage.getItem('arcade-muted') === '1')

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    localStorage.setItem('arcade-muted', next ? '1' : '0')
  }

  return (
    <CreditsProvider>
      <Navbar muted={muted} onToggleMute={toggleMute} />
      <MarqueeTicker />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </CreditsProvider>
  )
}