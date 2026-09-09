import { useState, useEffect } from 'react'
import { useCredits } from '../hooks/useCredits.jsx'

export default function MarqueeTicker({ lowEnd }) {
  const [stats, setStats] = useState({
    libraryCount: 0,
    activeDownloads: 0,
  })
  const { recentGrab } = useCredits()

  useEffect(() => {
    const load = async () => {
      try {
        const [libRes, dlRes] = await Promise.all([
          fetch('/api/romm/library').then((r) => r.ok ? r.json() : []),
          fetch('/api/qbit/transfers').then((r) => r.ok ? r.json() : []),
        ])
        setStats({
          libraryCount: Array.isArray(libRes) ? libRes.length : 0,
          activeDownloads: (dlRes && dlRes.length) || 0,
        })
      } catch {
        // keep defaults
      }
    }
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])

  if (lowEnd) return null

  const items = [
    `LIBRARY SIZE: ${stats.libraryCount} GAMES`,
    `ACTIVE DOWNLOADS: ${stats.activeDownloads}`,
    stats.recentGrab ? `MOST RECENT GRAB: ${stats.recentGrab.toUpperCase()}` : 'ARCADE CENTRAL',
    'HIGH SCORE: YOU',
    'PLAY AGAIN?',
    'CREDITS COST: 25\u00A2',
  ]

  return (
    <div className="marquee">
      <div className="marquee-inner">
        {items.map((item, i) => (
          <span key={i}>
            {item} <span className="sep" style={{ margin: '0 24px', color: '#ff00e0' }}>&#9670;</span>{' '}
          </span>
        ))}
      </div>
    </div>
  )
}
