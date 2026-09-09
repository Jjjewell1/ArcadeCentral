import { useState } from 'react'

export default function Settings({ lowEnd, onToggleLowEnd }) {
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('arcade-server') || '')
  const [apiKey, setApiKey] = useState('')

  const saveServer = () => {
    localStorage.setItem('arcade-server', serverUrl)
  }

  return (
    <div className="content">
      <h1>&#9881; SETTINGS</h1>

      <div className="setting-row">
        <div>
          <div className="label">3D ARCADE WORLD</div>
          <div className="desc">Disable for low-end devices. Falls back to flat neon UI.</div>
        </div>
        <div className={`toggle ${lowEnd ? '' : 'on'}`} onClick={onToggleLowEnd} />
      </div>

      {lowEnd ? (
        <div className="empty">3D MODE OFF - RUNNING IN FLAT MODE</div>
      ) : (
        <div className="empty" style={{ fontSize: '8px', marginTop: '16px' }}>
          Full 3D arcade enabled - bloom, neon, and camera dolly active
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h2>SERVER CONFIG</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            className="searchbar"
            style={{ width: '100%' }}
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="SERVER ADDRESS (OPTIONAL OVERRIDE)"
          />
          <div>
            <button
              className="btn btn-play"
              onClick={saveServer}
              style={{ border: '1px solid #00f0ff', color: '#00f0ff', background: 'transparent', fontFamily: 'var(--font-pixel)', fontSize: '9px', padding: '10px 16px', cursor: 'pointer', borderRadius: '4px' }}
            >
              SAVE
            </button>
          </div>
        </div>
      </div>

      <div className="empty" style={{ marginTop: '24px', fontSize: '8px' }}>
        ALL API KEYS ARE STORED SERVER-SIDE IN THE BACKEND .env - NEVER IN YOUR BROWSER
      </div>
    </div>
  )
}
