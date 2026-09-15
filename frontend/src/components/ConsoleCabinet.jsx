import { useEffect, useState, useMemo } from 'react'
import { sfx } from '../audio.js'
import GameCover from './GameCover.jsx'

/** Build a friendly label from a platform slug */
function platformLabel(slug) {
  const map = {
    nes: 'NES', snes: 'Super NES', n64: 'Nintendo 64',
    gbc: 'Game Boy Color', gba: 'Game Boy Advance',
    genesis: 'Sega Genesis', megadrive: 'Sega Genesis',
    master_system: 'Master System', game_gear: 'Game Gear',
    pce: 'TurboGrafx-16', turbografx16: 'TurboGrafx-16',
    ps1: 'PlayStation', ps2: 'PlayStation 2', psp: 'PSP',
    gamecube: 'GameCube', wii: 'Wii', nds: 'Nintendo DS',
    '3ds': 'Nintendo 3DS', switch: 'Nintendo Switch',
    atari: 'Atari', arcade: 'Arcade', neo_geo: 'Neo Geo',
  }
  return map[slug] || slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/** Get an accent colour for a platform */
function platformAccent(slug) {
  const colours = {
    nes: '#ff5c8a', snes: '#b48cff', n64: '#00c08c',
    gbc: '#9dff6b', gba: '#ffe45c',
    genesis: '#7d9dff', megadrive: '#7d9dff',
    master_system: '#ff9d5c', game_gear: '#ff9d5c',
    pce: '#7dcfff', turbografx16: '#7dcfff',
    ps1: '#7dcfff', ps2: '#5cffd9', psp: '#ffb45c',
    gamecube: '#ff6b6b', wii: '#ffd93d', nds: '#99a6c2',
    '3ds': '#ff5c5c', switch: '#7dcfff',
    atari: '#ffd95c', arcade: '#ffe600', neo_geo: '#00d7ff',
  }
  return colours[slug] || '#00f0ff'
}

export default function ConsoleCabinet({ platform, name }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        // RomM is the source of truth for the library. The per-platform route
        // filters server-side by platform id.
        const data = await fetch(`/api/romm/library/${platform}`, {
          headers: { 'Accept': 'application/json' },
        })
        if (!data.ok) throw new Error(`RomM returned ${data.status}`)
        const result = await data.json()
        const list = Array.isArray(result) ? result : (result?.items || [])
        setGames(list)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [platform])

  // Group games by the first letter of their name for a nice layout.
  // MUST be called before any conditional return - React requires every hook to
  // run on every render, else it errors with "Rendered more hooks than during
  // the previous render" (#310).
  const sorted = [...games].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const byLetter = useMemo(() => {
    const groups = {}
    for (const g of sorted) {
      const letter = (g.name || '').charAt(0).toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(g)
    }
    return groups
  }, [sorted])

  if (loading) {
    return (
      <div className="cabinet-loading">
        <span>LOADING GAMES</span>
        <span className="dots"><span>.</span><span>.</span><span>.</span></span>
      </div>
    )
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>
  }

  if (games.length === 0) {
    return (
      <div className="cabinet-empty">
        <div className="empty-title">NO GAMES FOR {platformLabel(platform)}</div>
        <p className="empty-sub">
          No ROMs found. Make sure your Unraid share is mounted and the NAS API is running.
        </p>
      </div>
    )
  }

  return (
    <div className="console-cabinet">
      <div className="cabinet-header">
        <span className="cabinet-name">{name || platformLabel(platform)}</span>
        <span className="cabinet-accent" style={{ color: platformAccent(platform) }}>{'>'}</span>
      </div>

      <div className="cabinet-games">
        {Object.entries(byLetter).map(([letter, games]) => (
          <div key={letter} className="cabinet-letter-group">
            <span className="cabinet-letter">{letter}</span>
            <div className="cabinet-game-grid">
              {games.map((g) => (
                <div
                  key={g.id}
                  className="cabinet-game-card"
                  onClick={() => { sfx.blip(); window.location.href = `/library?platform=${platform}` }}
                >
                  <GameCover game={g} size="sm" />
                  <div className="cabinet-game-title">{g.name || 'Untitled'}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}