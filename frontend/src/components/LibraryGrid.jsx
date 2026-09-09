import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useApi from '../hooks/useApi.js'
import Player from './Player.jsx'
import GameCover from './GameCover.jsx'
import { sfx } from '../audio.js'

function fmtGb(g) {
  const bytes = typeof g === 'number' ? g : g?.size || g?.file_size_bytes
  if (!bytes) return ''
  const gb = bytes / 1024 / 1024 / 1024
  return gb >= 1 ? gb.toFixed(2) + ' GB' : (gb * 1024).toFixed(0) + ' MB'
}

export default function LibraryGrid() {
  const [games, setGames] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [activePlatform, setActivePlatform] = useState('all')
  const [playingGame, setPlayingGame] = useState(null)
  const [query, setQuery] = useState('')
  const { request, loading } = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await request('/romm/library')
        const list = Array.isArray(data) ? data : (data?.items || [])
        setGames(list)
        const plats = [...new Set(list.map((g) =>
          typeof g.platform === 'string' ? g.platform : (g.platform?.name || 'Unknown')))]
        setPlatforms(plats)
      } catch {
        setGames([])
      }
    }
    load()
  }, [request])

  const visible = useMemo(() => {
    let list = games
    if (activePlatform !== 'all') {
      list = list.filter((g) =>
        (typeof g.platform === 'string' ? g.platform : (g.platform?.name || 'Unknown')) === activePlatform)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((g) =>
        (g.name || g.file_name || '').toLowerCase().includes(q))
    }
    return list
  }, [games, activePlatform, query])

  const handlePlay = (game) => {
    sfx.coin()
    setPlayingGame(game)
  }

  return (
    <>
      <div className="chips">
        <button
          className={`chip ${activePlatform === 'all' ? 'active' : ''}`}
          onClick={() => { setActivePlatform('all'); sfx.blip() }}
        >
          ALL ({games.length})
        </button>
        {platforms.map((p) => (
          <button
            key={p}
            className={`chip ${activePlatform === p ? 'active' : ''}`}
            onClick={() => { setActivePlatform(p); sfx.blip() }}
          >
            {p.toUpperCase()}
          </button>
        ))}
        <input
          className="lib-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="FILTER RACK..."
        />
      </div>

      {loading ? (
        <div className="loading">
          <span>LOADING</span>
          <span className="dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      ) : games.length === 0 ? (
        <div className="empty-card">
          <div className="empty-title">NO GAMES ON THE RACKS YET</div>
          <p className="empty-sub">
            Arcade Central lists whatever RomM has indexed. Import your ROMs into RomM on the NAS
            (the &#8216;series-x-s&#8217; platform folder is empty right now), or grab titles from
            the Search Counter &mdash; once a grab completes and your sort/import pipeline moves them
            into the RomM library, they show up here with cover art, regions and sizes.
          </p>
          <div className="empty-actions">
            <Link to="/search" className="btn-grab big">&#9679; GO GRAB SOMETHING</Link>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">NO GAMES MATCH THE FILTERS</div>
      ) : (
        <div className="grid">
          {visible.map((g) => (
            <div className="game-card" key={g.id}>
              <GameCover game={g} />
              <div className="body">
                <div className="title">{g.name || g.file_name || 'Untitled'}</div>
                <div className="meta">
                  <span>{typeof g.platform === 'string' ? g.platform : g.platform?.name || 'Unknown'}</span>
                  {g.region && <span>{g.region}</span>}
                  {fmtGb(g) && <span>{fmtGb(g)}</span>}
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-play" onClick={() => handlePlay(g)}>
                  PLAY
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {playingGame && (
        <Player game={playingGame} onClose={() => setPlayingGame(null)} />
      )}
    </>
  )
}