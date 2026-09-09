import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { sfx } from '../audio.js'
import { useCredits } from '../hooks/useCredits.jsx'

export default function Navbar({ lowEnd, muted, onToggleMute }) {
  const { credits } = useCredits()
  const location = useLocation()
  const prevZone = useRef(null)

  const zones = [
    { path: '/', label: 'LOBBY' },
    { path: '/search', label: 'SEARCH' },
    { path: '/library', label: 'LIBRARY' },
    { path: '/downloads', label: 'DOWNLOADS' },
    { path: '/settings', label: 'SETTINGS' },
  ]

  // Footstep sound on nav (only for non-lowend)
  const handleNav = (e) => {
    if (!lowEnd) sfx.footstep()
  }
  useEffect(() => {
    return () => { prevZone.current = null }
  }, [])

  return (
    <>
      <nav className="navbar" onClick={handleNav}>
        <div className="logo">ARCADE&#9679;CENTRAL</div>
        {zones.map((z) => (
          <Link
            key={z.path}
            to={z.path}
            onClick={handleNav}
            className={location.pathname === z.path ? 'active' : ''}
          >
            {z.label}
          </Link>
        ))}
      </nav>
      <div className="hud">
        <div className="credits">CREDITS: {credits}</div>
        <button className="button" onClick={onToggleMute}>
          {muted ? 'SOUND: OFF' : 'SOUND: ON'}
        </button>
      </div>
    </>
  )
}
