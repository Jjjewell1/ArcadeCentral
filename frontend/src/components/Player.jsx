import { useEffect, useRef, useState } from 'react'
import { sfx } from '../audio.js'

const EJS_CDN = 'https://cdn.emulatorjs.org/stable/data/'
const BOOT_TIMEOUT_MS = 20000
const HEAVY_BYTES = 1.5 * 1024 * 1024 * 1024 // browser WASM cores choke beyond ~1.5GB

// RomM platform slug -> EmulatorJS core id. Anything absent here (pc, xbox,
// switch, dos, ...) has no browser core and falls back to download.
const EJS_CORES = {
  nes: 'nes',
  snes: 'snes',
  n64: 'n64',
  gb: 'gb',
  gbc: 'gb',
  gba: 'gba',
  nds: 'nds',
  ngp: 'ngp',
  ngpc: 'ngp',
  gamecube: 'dolphin',
  wii: 'dolphin',
  'sega-master-system': 'segaMD',
  genesis: 'segaMD',
  'sega-cd': 'segaCD',
  saturn: 'segaSaturn',
  pce: 'pce',
  'turbografx-16': 'pce',
  psx: 'psx',
  psp: 'psp',
  ps2: 'ps2',
}

function setEjsGlobals(game, core) {
  window.EJS_player = '#player-root'
  window.EJS_core = core
  window.EJS_gameUrl = `/api/romm/proxy/play/${game.id}`
  window.EJS_gameName = game.name || game.fs_name || game.file_name || 'Arcade'
  window.EJS_pathtodata = EJS_CDN
  window.EJS_backgroundColor = '#05000f'
  window.EJS_coreOptions = {}
  window.EJS_netplayUrl = undefined
  window.EJS_gameID = `arcade-${game.id}`
}

function loadEjsScript(timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const poll = () => {
      if (window.EJS_emulator) {
        document.documentElement.__ejsLoaded = true
        return resolve()
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout'))
      setTimeout(poll, 150)
    }
    if (document.documentElement.__ejsLoaded === true || document.documentElement.__ejsLoading) {
      return poll()
    }
    document.documentElement.__ejsLoading = true
    const el = document.createElement('script')
    el.src = `${EJS_CDN}loader.js`
    el.onload = poll
    el.onerror = () => reject(new Error('cdn'))
    document.head.appendChild(el)
  })
}

async function bootEjs(game, core) {
  const hadEmulator = !!window.EJS_emulator
  setEjsGlobals(game, core)
  await loadEjsScript(BOOT_TIMEOUT_MS)
  if (!window.EJS_emulator) throw new Error('timeout')
  // First boot: the loader already consumed the globals and started itself.
  // Later games: reuse the live instance and tell it to reload the new rom.
  if (hadEmulator) window.EJS_emulator.load()
}

function fmtGb(bytes) {
  const gb = bytes / 1024 / 1024 / 1024
  return gb >= 1 ? gb.toFixed(2) + ' GB' : (gb * 1024).toFixed(0) + ' MB'
}

export default function Player({ game, onClose }) {
  const [state, setState] = useState('boot') // boot | run | error
  const [error, setError] = useState('')
  const rootRef = useRef(null)

  const core = EJS_CORES[game.platform_slug]
  const hasId = !!game.id
  const heavy = (game.fs_size_bytes || 0) > HEAVY_BYTES
  const eligible = core && !heavy && hasId
  const sizeLabel = game.fs_size_bytes ? fmtGb(game.fs_size_bytes) : ''

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

  useEffect(() => {
    if (!eligible) return
    let alive = true
    setState('boot')
    bootEjs(game, core)
      .then(() => {
        if (!alive) return
        setState('run')
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message === 'cdn' ? 'EMULATOR CDN UNREACHABLE' : 'EMULATOR BOOT TIMED OUT')
        setState('error')
      })
    return () => {
      alive = false
      window.EJS_emulator?.destroy?.()
      window.EJS_emulator = undefined
      document.documentElement.__ejsLoading = false
      delete document.documentElement.__ejsLoaded
    }
  }, [game, core, heavy, eligible])

  const forceLoad = async () => {
    setState('boot')
    try {
      await bootEjs(game, core)
      setState('run')
    } catch {
      setError('EMULATOR BOOT TIMED OUT')
      setState('error')
    }
  }

  const downloadUrl = `/api/romm/proxy/play/${game.id}`

  return (
    <div className="player-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="player-bar">
        <span style={{ fontSize: '10px', color: '#00f0ff' }}>
          {game.name || game.fs_name || game.file_name}
          <span style={{ color: '#8fb6c9', marginLeft: 8 }}>
            {game.platform_display_name || game.platform_slug}
          </span>
        </span>
        <button className="exit" onClick={() => { sfx.blip(); onClose() }}>
          STEP OUT
        </button>
      </div>

      <div id="player-root" ref={rootRef} style={{ display: state === 'run' ? 'block' : 'none', flex: 1 }} />

      {!hasId ? (
        <div className="player-fallback">
          <div className="player-fallback-title">ROM ERROR — MISSING ID</div>
          <p className="player-fallback-body">
            This rom has no id and can’t be loaded or downloaded. Trigger a fresh scan or resync.
          </p>
          <div className="player-fallback-actions">
            <button className="exit" onClick={() => { sfx.blip(); onClose() }}>STEP OUT</button>
          </div>
        </div>
      ) : !core ? (
        <div className="player-fallback">
          <div className="player-fallback-title">
            NO BROWSER EMULATOR FOR {game.platform_display_name || game.platform_slug}
          </div>
          <p className="player-fallback-body">
            {game.name} is a {game.platform_display_name || game.platform_slug} title{sizeLabel ? ` (${sizeLabel})` : ''}
            — that platform has no browser core. Download it and run it in a native emulator, or
            stream it from an emulator container on the NAS (coming next).
          </p>
          <div className="player-fallback-actions">
            <a className="btn-grab big" href={downloadUrl} download>⬇ DOWNLOAD ROM</a>
          </div>
        </div>
      ) : heavy ? (
        <div className="player-fallback">
          <div className="player-fallback-title">HEAVY CART — BIG FILE</div>
          <p className="player-fallback-body">
            {game.name} is {sizeLabel} — the in-browser emulator needs the whole file in memory and
            will likely freeze. Streaming it from an emulator container on the NAS is the reliable
            route for files this size.
          </p>
          <div className="player-fallback-actions">
            <a className="btn-grab big" href={downloadUrl} download>⬇ DOWNLOAD ROM</a>
            <button className="exit" onClick={forceLoad}>STILL TRY IN BROWSER</button>
          </div>
        </div>
      ) : state === 'boot' ? (
        <div className="loading">
          <span>BOOTING EMULATOR</span>
          <span className="dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      ) : state === 'error' ? (
        <div className="player-fallback">
          <div className="player-fallback-title">{error}</div>
          <p className="player-fallback-body">
            The browser emulator couldn’t start. Grab the file and run it in a native emulator, or
            stream it from an emulator container on the NAS.
          </p>
          <div className="player-fallback-actions">
            <a className="btn-grab big" href={downloadUrl} download>⬇ DOWNLOAD ROM</a>
            <button className="exit" onClick={forceLoad}>RETRY EMULATOR</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}