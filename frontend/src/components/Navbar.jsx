import { Link, useLocation } from 'react-router-dom'
import { sfx } from '../audio.js'
import { useCredits } from '../hooks/useCredits.jsx'

export default function Navbar({ muted, onToggleMute }) {
  const { credits } = useCredits()
  const location = useLocation()

  const zones = [
    { path: '/', label: 'LOBBY' },
    { path: '/search', label: 'SEARCH' },
    { path: '/library', label: 'LIBRARY' },
    { path: '/downloads', label: 'DOWNLOADS' },
    { path: '/settings', label: 'SETTINGS' },
  ]

  return (
    <nav className="navbar">
      <div className="logo">ARCADE&#9679;CENTRAL</div>
      <div className="zones">
        {zones.map((z) => (
          <Link
            key={z.path}
            to={z.path}
            onClick={() => sfx.blip()}
            className={location.pathname === z.path ? 'active' : ''}
          >
            {z.label}
          </Link>
        ))}
      </div>
      <div className="hud">
        <div className="credits">CREDITS: {credits}</div>
        <button className="button" onClick={onToggleMute}>
          {muted ? 'SOUND: OFF' : 'SOUND: ON'}
        </button>
      </div>
    </nav>
  )
}