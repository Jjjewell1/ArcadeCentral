import { useState } from 'react'
import useApi from '../hooks/useApi.js'
import GameCover from './GameCover.jsx'
import { sfx } from '../audio.js'

// Platform accent colours matching the CSS variable palette
const platformAccents = {
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

export default function Cartridge({ game, onPlay }) {
  const [isHovering, setIsHovering] = useState(false)
  const [showCover, setShowCover] = useState(true)

  const title = game?.name || game?.file_name || game?.title || 'Untitled'
  const platform = game?.platform_slug || ''
  const cover = game?.path_cover

  // Get accent colour for this platform
  const accent = platformAccents[platform] || '#00f0ff'

  const handlePlay = () => {
    sfx.coin()
    if (onPlay) onPlay(game)
    // Navigate to the play URL or RomM proxy
    window.location.href = `/api/romm/proxy/play/${game.id}`
  }

  return (
    <div
      className="cartridge-card"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handlePlay}
    >
      <div className="cartridge-body">
        <div className="cartridge-label" style={{ color: accent }}>
          <span className="cartridge-title">{title}</span>
          <span className="cartridge-platform">
            {platform.toUpperCase().replace(/_/g, ' ')}
          </span>
        </div>

        {cover && (
          <div className="cartridge-cover" style={{
            backgroundImage: cover ? `url('${cover}')` : 'none',
            borderColor: accent,
          }}>
            <img
              src={cover}
              alt={title}
              loading="lazy"
              onError={() => setShowCover(false)}
            />
          </div>
        )}

        <div className="cartridge-metal-contact" />
        <div className="cartridge-metal-contact" />
      </div>

      {isHovering && (
        <div className="cartridge-actions">
          <button className="btn-play" onClick={handlePlay}>
            {'> PLAY'}
          </button>
        </div>
      )}
    </div>
  )
}