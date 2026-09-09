import { useState, useRef } from 'react'
import { sfx } from '../audio.js'
import { useCredits } from '../hooks/useCredits.jsx'
import useApi from '../hooks/useApi.js'

export default function GameCard({ game }) {
  const [grabbing, setGrabbing] = useState(false)
  const [grabbed, setGrabbed] = useState(false)
  const { addCredit } = useCredits()
  const { request } = useApi()

  const title = game?.title || game?.name || 'Untitled'
  const platform = game?.platform || game?.categories?.[0]?.name || ''
  const size = game?.size ? (game.size / 1024 / 1024 / 1024).toFixed(2) + ' GB' : ''
  const seeders = game?.seeders ?? game?.peers ?? ''
  const source = game?.indexerFlag || game?.infoHash ? 'torrent' : 'usenet'
  const coverArt = game?.coverArt || game?.images?.[0]?.url || ''

  const handleGrab = async (e) => {
    e.stopPropagation()
    setGrabbing(true)
    sfx.coin()
    // mechanical ka-chunk timing
    const delay = (ms) => new Promise((r) => setTimeout(r, ms))
    await delay(120)
    sfx.grab()
    try {
      const releaseId = game?.id ?? game?.releaseId
      await request('/romarr/grab', {
        method: 'POST',
        body: JSON.stringify({ releaseId }),
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
      <div className="cover">
        {coverArt ? (
          <img src={coverArt} alt={title} />
        ) : (
          <div className="noart">&#9670;</div>
        )}
      </div>
      <div className="body">
        <div className="title">{title}</div>
        <div className="meta">
          {platform && <span>{platform}</span>}
          {size && <span>{size}</span>}
          {source && <span>{source}</span>}
          {seeders && <span>{seeders} SEED</span>}
        </div>
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
