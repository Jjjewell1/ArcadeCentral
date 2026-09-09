import { useEffect, useMemo, useState } from 'react'
import useApi from '../hooks/useApi.js'
import Player from './Player.jsx'
import { sfx } from '../audio.js'

export default function LibraryGrid({ lowEnd, onStepInside }) {
  const [games, setGames] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [activePlatform, setActivePlatform] = useState('all')
  const [playingGame, setPlayingGame] = useState(null)
  const { request, loading } = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await request('/romm/library')
        const list = Array.isArray(data) ? data : (data?.items || [])
        setGames(list)
        const plats = [...new Set(list.map((g) => g.platform || 'Unknown'))]
        setPlatforms(plats)
      } catch {
        setGames([])
      }
    }
    load()
  }, [])

  const visible = useMemo(() => {
    if (activePlatform === 'all') return games
    return games.filter((g) => (g.platform || 'Unknown') === activePlatform)
  }, [games, activePlatform])

  const handlePlay = (game) => {
    sfx.coin()
    if (onStepInside) onStepInside()
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
      </div>

      {loading ? (
        <div className="loading">
          <span>LOADING</span>
          <span className="dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">NO GAMES FOUND</div>
      ) : (
        <div className="grid">
          {visible.map((g) => (
            <div className="game-card" key={g.id}>
              <div className="cover">
                <div className="noart">&#9654;</div>
              </div>
              <div className="body">
                <div className="title">{g.name || g.file_name || 'Untitled'}</div>
                <div className="meta">
                  <span>{g.platform}</span>
                  {g.size && <span>{(g.size / 1024 / 1024 / 1024).toFixed(2) + ' GB'}</span>}
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
        <Player game={playingGame} onClose={() => { setPlayingGame(null); if (onStepInside) onStepInside() }} />
      )}
    </>
  )
}
