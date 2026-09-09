import { useEffect, useState } from 'react'
import useApi from '../hooks/useApi.js'
import { useCredits } from '../hooks/useCredits.jsx'

export default function Home() {
  const [stats, setStats] = useState({ libraryCount: 0, activeDownloads: 0 })
  const [recent, setRecent] = useState([])
  const { request } = useApi()
  const { recentGrab } = useCredits()

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        request('/romm/library'),
        request('/qbit/transfers'),
        request('/sabnzbd/history'),
      ])
      const [lib, qbit, sab] = results.map((r) => r.status === 'fulfilled' ? r.value : null)
      const libCount = Array.isArray(lib) ? lib.length : lib?.items?.length || 0
      const dlCount = (Array.isArray(qbit) ? qbit.length : 0) + (sab?.history?.slots?.length || 0)
      setStats({ libraryCount: libCount, activeDownloads: dlCount })
      if (Array.isArray(lib)) setRecent(lib.slice(-6).reverse())
    }
    load()
  }, [])

  return (
    <div className="content">
      <h1>&#9733; WELCOME TO ARCADE CENTRAL &#9733;</h1>
      <div className="stats">
        <div className="stat-card">
          <div className="num">{stats.libraryCount}</div>
          <div className="label">GAMES IN LIBRARY</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.activeDownloads}</div>
          <div className="label">ACTIVE DOWNLOADS</div>
        </div>
        {recentGrab && (
          <div className="stat-card" style={{ borderColor: '#ffe600' }}>
            <div className="num" style={{ fontSize: '12px', color: '#ffe600' }}>
              {recentGrab.toUpperCase()}
            </div>
            <div className="label">MOST RECENT GRAB</div>
          </div>
        )}
      </div>

      <h2>RECENTLY ADDED</h2>
      {recent.length === 0 ? (
        <div className="empty">NO GAMES YET - HIT THE SEARCH COUNTER</div>
      ) : (
        <div className="grid">
          {recent.map((g) => (
            <div className="game-card" key={g.id}>
              <div className="cover">
                <div className="noart">&#9670;</div>
              </div>
              <div className="body">
                <div className="title">{g.name || g.file_name}</div>
                <div className="meta"><span>{g.platform}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
