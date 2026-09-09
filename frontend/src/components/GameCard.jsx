import { useState } from 'react'
import { sfx } from '../audio.js'
import { useCredits } from '../hooks/useCredits.jsx'
import useApi from '../hooks/useApi.js'
import GameCover from './GameCover.jsx'

export default function GameCard({ game }) {
  const [grabbing, setGrabbing] = useState(false)
  const [grabbed, setGrabbed] = useState(false)
  const { addCredit } = useCredits()
  const { request } = useApi()

  const title = game?.title || game?.name || 'Untitled'
  const platform = game?.file_format || game?.region || game?.platform || game?.categories?.[0]?.name || ''
  const size = game?.size_bytes ? (game.size_bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB' : (game?.size ? (game.size / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '')
  const seeders = game?.seeders ?? game?.peers ?? ''
  const region = game?.region || ''
  const format = game?.file_format || ''

  const handleGrab = async (e) => {
    e.stopPropagation()
    setGrabbing(true)
    sfx.coin()
    const delay = (ms) => new Promise((r) => setTimeout(r, ms))
    await delay(120)
    sfx.grab()
    try {
      const releaseId = game?.matched_release_id ?? game?.release_id ?? game?.releaseId ?? game?.id
      const indexerId = game?.indexer_id ?? game?.indexerId
      const indexerGuid = game?.indexer_guid ?? game?.guid
      const downloadUrl = game?.download_url ?? game?.downloadUrl
      const gameId = game?.matched_game_id ?? game?.game_id ?? game?.gameId
      await request('/romarr/grab', {
        method: 'POST',
        body: JSON.stringify({
          indexerId,
          indexerGuid,
          downloadUrl,
          title,
          releaseId,
          gameId,
        }),
      })
      setGrabbed(true)
      addCredit(title)
      sfx.coin()
    } catch {
      sfx.error()
    } finally {
      setGrabbing(false)
    }
  }

  return (
    <div className="game-card">
      <GameCover game={game} title={title} platform={platform} size="lg" />
      <div className="badges">
        {seeders !== '' && (
          <span className={`badge ${seeders > 0 ? 'seed-hot' : 'seed-cold'}`}>
            &#9829; {seeders} SEED
          </span>
        )}
        {region && <span className="badge badge-region">{region}</span>}
        {format && <span className="badge badge-format">{format}</span>}
        {size && <span className="badge badge-size">{size}</span>}
      </div>
      <div className="body">
        <div className="title">{title}</div>
      </div>
      <div className="actions">
        <button
          className="btn btn-grab"
          onClick={handleGrab}
          disabled={grabbing || grabbed}
        >
          {grabbed ? 'GRABBED!' : grabbing ? 'KACHUNK...' : 'GRAB'}
        </button>
      </div>
    </div>
  )
}