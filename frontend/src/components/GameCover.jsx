const ACCENTS = [
  ['nes', '#ff5c8a'],
  ['snes', '#b48cff'],
  ['n64', '#00c08c'],
  ['game boy', '#9dff6b'],
  ['gba', '#ffe45c'],
  ['gbc', '#9dff6b'],
  ['genesis', '#7d9dff'],
  ['megadrive', '#7d9dff'],
  ['master', '#ff9d5c'],
  ['game gear', '#ff9d5c'],
  ['ps1', '#7dcfff'],
  ['playstation', '#7dcfff'],
  ['ps2', '#5cffd9'],
  ['psp', '#ffb45c'],
  ['xbox', '#9dff5c'],
  ['ds', '#99a6c2'],
  ['3ds', '#ff5c5c'],
  ['dreamcast', '#78b9ff'],
  ['saturn', '#c4c4ff'],
  ['atari', '#ffd95c'],
  ['arcade', '#ffe600'],
  ['neo', '#00d7ff'],
]

const FALLBACK = ['#00f0ff', '#ff00e0', '#ffe600', '#00d7ff']

export function platformAccent(platform = '') {
  const key = String(platform || '').toLowerCase()
  const match = ACCENTS.find(([p]) => key.includes(p))
  if (match) return match[1]
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return FALLBACK[hash % FALLBACK.length]
}

export function gameImage(game) {
  if (game?.path_cover) return `/api/romm/asset${game.path_cover}`
  if (game?.coverArt) return game.coverArt
  if (game?.images?.[0]?.url) return game.images[0].url
  return ''
}

export default function GameCover({ game, title, platform, size = 'md' }) {
  const name = title || game?.title || game?.name || game?.file_name || '?'
  const plat = platform || (typeof game?.platform === 'string' ? game.platform : game?.platform?.name || game?.platform?.slug || '')
  const img = gameImage(game)
  const accent = platformAccent(plat)

  if (img) {
    return (
      <div className="cover">
        <img src={img} alt={name} loading="lazy" />
      </div>
    )
  }

  const letter = name.trim().charAt(0).toUpperCase()
  return (
    <div
      className={`cover tile tile-${size}`}
      style={{
        background: `radial-gradient(circle at 50% 0%, ${accent}33 0%, #0a001a 65%)`,
        borderBottom: `2px solid ${accent}`,
        boxShadow: `inset 0 0 40px ${accent}14`,
      }}
    >
      <div className="tile-inner">
        <span className="tile-letter" style={{ color: accent, textShadow: `0 0 14px ${accent}` }}>
          {letter}
        </span>
        <span className="tile-title">{name}</span>
        {plat && <span className="tile-plat" style={{ color: accent }}>{plat.toUpperCase()}</span>}
      </div>
    </div>
  )
}