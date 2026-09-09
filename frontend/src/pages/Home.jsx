import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useApi from '../hooks/useApi.js'
import { useCredits } from '../hooks/useCredits.jsx'
import GameCover from '../components/GameCover.jsx'
import { sfx } from '../audio.js'

function fmtGb(bytes) {
  if (!bytes) return '0 GB'
  const gb = bytes / 1024 / 1024 / 1024
  return gb >= 1 ? gb.toFixed(2) + ' GB' : (gb * 1024).toFixed(0) + ' MB'
}

function ageLabel(ts) {
  if (!ts) return ''
  const mins = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 60))
  if (mins < 60) return `${mins}M AGO`
  if (mins < 1440) return `${Math.floor(mins / 60)}H AGO`
  return `${Math.floor(mins / 1440)}D AGO`
}

export default function Home() {
  const [stats, setStats] = useState({ libraryCount: 0, queueCount: 0, inboundMBs: 0, totalBytes: 0 })
  const [library, setLibrary] = useState([])
  const [transfers, setTransfers] = useState([])
  const [heroQuery, setHeroQuery] = useState('')
  const { request } = useApi()
  const { recentGrab } = useCredits()

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        request('/romm/library'),
        request('/qbit/transfers'),
      ])
      const lib = results[0].status === 'fulfilled' ? (results[0].value?.items || []) : []
      const qbit = results[1].status === 'fulfilled' ? (results[1].value || []) : []
      setLibrary(lib)
      setTransfers(qbit)
      setStats({
        libraryCount: lib.length,
        queueCount: qbit.filter((t) => t.progress < 1).length,
        inboundMBs: qbit.reduce((a, t) => a + (t.dlspeed || 0), 0) / 1024 / 1024,
        totalBytes: qbit.reduce((a, t) => a + (t.total_size || 0), 0),
      })
    }
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [request])

  const recentlyAdded = useMemo(
    () => [...library].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 12),
    [library],
  )

  const justLanded = useMemo(
    () => [...transfers].sort((a, b) => (b.added_on || 0) - (a.added_on || 0)).slice(0, 8),
    [transfers],
  )

  const heroSearch = (e) => {
    e.preventDefault()
    sfx.coin()
    window.location.href = `/search?q=${encodeURIComponent(heroQuery)}`
  }

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="hero-wordmark"><span>A</span>RCADE<span>&#9679;</span>CENTRAL</h1>
        <p className="hero-tag">ONE INSERT COIN TO RULE THEM ALL &mdash; INDEXERS, TORRENTS &amp; RACKS IN ONE CABINET</p>
        <form className="hero-search" onSubmit={heroSearch}>
          <input
            value={heroQuery}
            onChange={(e) => { setHeroQuery(e.target.value); sfx.blip() }}
            placeholder="DROP A GAME NAME..."
          />
          <button type="submit">INSERT COIN</button>
        </form>
        <div className="hero-hint">
          <Link to="/search">BROWSE INDEXERS</Link>
          <span className="sep">&#9670;</span>
          <Link to="/library">CHECK THE RACKS</Link>
        </div>
      </section>

      {/* ===== LIVE STATS ===== */}
      <div className="stats">
        <div className="stat-card">
          <div className="num">{stats.libraryCount}</div>
          <div className="label">GAMES ON THE RACKS</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.queueCount}</div>
          <div className="label">INBOUND QUEUE</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.6)' }}>
            {stats.inboundMBs >= 1 ? stats.inboundMBs.toFixed(1) + ' MB/s' : 'IDLE'}
          </div>
          <div className="label">CURRENT INBOUND</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ fontSize: '15px' }}>{fmtGb(stats.totalBytes)}</div>
          <div className="label">TRACKED BY THE CART</div>
        </div>
        {recentGrab && (
          <div className="stat-card" style={{ borderColor: '#ffe600' }}>
            <div className="num" style={{ fontSize: '11px', color: '#ffe600' }}>{recentGrab.toUpperCase()}</div>
            <div className="label">MOST RECENT GRAB</div>
          </div>
        )}
      </div>

      {/* ===== RECENTLY ADDED ===== */}
      <section className="section">
        <div className="section-head">
          <h2>&#9733; RECENTLY ADDED</h2>
          <Link to="/library" className="section-link">VIEW ALL &rsaquo;</Link>
        </div>
        {recentlyAdded.length === 0 ? (
          <div className="empty-card">
            <div className="empty-title">THE RACKS ARE BARE</div>
            <p className="empty-sub">
              No ROMs are imported into RomM yet. Point it at your ROM folders on the NAS,
              or grab something fresh from the indexers and it lands here.
            </p>
            <Link to="/search" className="btn-grab big">
              &#9679; SEARCH THE INDEXERS NOW
            </Link>
          </div>
        ) : (
          <div className="grid">
            {recentlyAdded.map((g) => (
              <div className="game-card" key={g.id}>
                <GameCover game={g} />
                <div className="body">
                  <div className="title">{g.name || g.file_name}</div>
                  <div className="meta">
                    <span>{typeof g.platform === 'string' ? g.platform : g.platform?.name || ''}</span>
                    {g.size && <span>{fmtGb(g.size)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== JUST LANDED ===== */}
      <section className="section">
        <div className="section-head">
          <h2>&#9654; JUST LANDED</h2>
          <Link to="/downloads" className="section-link">ALL DOWNLOADS &rsaquo;</Link>
        </div>
        {justLanded.length === 0 ? (
          <div className="empty-card">
            <div className="empty-title">NOTHING IN THE CHUTE</div>
            <p className="empty-sub">
              Grab something from the Search Counter and track it live here &mdash;
              progress, speed, ETA and all.
            </p>
          </div>
        ) : (
          justLanded.map((t) => {
            const progress = Math.round((t.progress || 0) * 100)
            const active = t.dlspeed > 0
            return (
              <div className="landed-row" key={t.hash}>
                <div className="landed-info">
                  <div className="landed-name">{t.name}</div>
                  <div className="landed-meta">
                    <span>{fmtGb(t.total_size)}</span>
                    <span>{t.seeders || 0} SEED / {t.leechers || 0} LEECH</span>
                    <span>{ageLabel(t.added_on)}</span>
                    <span className={`state ${active ? 'live' : ''}`}>
                      {active ? t.dlspeed / 1024 / 1024 >= 1 ? (t.dlspeed / 1024 / 1024).toFixed(1) + ' MB/s' : (t.dlspeed / 1024).toFixed(0) + ' KB/s' : (t.state || '').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bar">
                  <div className="fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}