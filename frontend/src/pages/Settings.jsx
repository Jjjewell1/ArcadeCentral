import { useState } from 'react'

export default function Settings() {
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('arcade-server') || '')
  const [apiKey, setApiKey] = useState('')

  const saveServer = () => {
    localStorage.setItem('arcade-server', serverUrl)
  }

  return (
    <div className="content">
      <h1>&#9881; SETTINGS</h1>

      <div style={{ marginTop: '8px' }}>
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
