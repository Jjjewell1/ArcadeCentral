import { useEffect, useState } from 'react'
import useApi from '../hooks/useApi.js'
import { sfx } from '../audio.js'

export default function Player({ game, onClose }) {
  const [playUrl, setPlayUrl] = useState('')
  const { request } = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await request(`/romm/play/${game.id}`)
        setPlayUrl(data.playUrl)
      } catch {
        setPlayUrl('')
      }
    }
    load()
  }, [game])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        sfx.blip()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="player-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="player-bar">
        <span style={{ fontSize: '10px', color: '#00f0ff' }}>{game.name || game.file_name}</span>
        <button className="exit" onClick={() => { sfx.blip(); onClose() }}>
          STEP OUT
        </button>
      </div>
      {playUrl ? (
        <iframe src={playUrl} title={game.name} allowFullScreen />
      ) : (
        <div className="loading">LOADING EMULATOR...</div>
      )}
    </div>
  )
}
