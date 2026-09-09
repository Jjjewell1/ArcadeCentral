import { useEffect, useState } from 'react'
import useApi from '../hooks/useApi.js'
import { sfx } from '../audio.js'

export default function DownloadPanel({ type = 'all' }) {
  const [transfers, setTransfers] = useState([])
  const [nzbQueue, setNzbQueue] = useState({ queue: [] })
  const { request } = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        if (type === 'torrents' || type === 'all') {
          const data = await request('/qbit/transfers')
          setTransfers(Array.isArray(data) ? data : [])
        }
        if (type === 'nzb' || type === 'all') {
          const data = await request('/sabnzbd/queue')
          setNzbQueue(data?.queue || { queue: [] })
        }
      } catch {
        // services may be unreachable
      }
    }
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [type])

  const pauseResume = async (hash, action) => {
    sfx.blip()
    await request(`/qbit/${action}/${hash}`, { method: 'POST' })
  }

  const torrentItems = transfers.map((t) => {
    const progress = t.progress * 100
    const speed = t.dlspeed ? (t.dlspeed / 1024 / 1024).toFixed(1) + ' MB/s' : '0 B/s'
    const eta = t.eta && t.eta > 0
      ? new Date(t.eta * 1000).toISOString().substr(11, 8)
      : '--:--:--'
    const size = t.size ? (t.size / 1024 / 1024 / 1024).toFixed(2) + ' GB' : ''
    return (
      <div className="download-item" key={t.hash}>
        <div className="name">{t.name}</div>
        <div className="bar">
          <div className="fill" style={{ width: `${progress.toFixed(1)}%` }} />
        </div>
        <div className="meta">
          <span>{progress.toFixed(1)}%</span>
          <span>{speed}</span>
          <span>ETA {eta}</span>
          <span>{size}</span>
        </div>
        <div className="controls">
          {t.state === 'pausedUP' || t.state === 'stoppedUP' ? (
            <button onClick={() => pauseResume(t.hash, 'resume')}>RESUME</button>
          ) : (
            <button onClick={() => pauseResume(t.hash, 'pause')}>PAUSE</button>
          )}
        </div>
      </div>
    )
  })

  const nzbItems = (nzbQueue.slots || []).map((n) => {
    const size = n.size || ''
    const progress = n.percentage ? n.percentage : 0
    return (
      <div className="download-item" key={n.nzo_id || n.filename}>
        <div className="name">{n.filename}</div>
        <div className="bar">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="meta">
          <span>{progress}%</span>
          <span>{n.mb ? n.mb + ' MB' : size}</span>
          <span>{n.speed ? n.speed : ''}</span>
        </div>
      </div>
    )
  })

  const empty = !torrentItems.length && !nzbItems.length

  return (
    <div>
      {empty ? (
        <div className="empty">NO ACTIVE DOWNLOADS - SLOT MACHINE IS READY</div>
      ) : (
        <>
          {torrentItems}
          {nzbItems}
        </>
      )}
    </div>
  )
}
