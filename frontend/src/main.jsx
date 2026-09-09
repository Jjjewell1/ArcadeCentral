import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  enterLowEnd = () => {
    localStorage.setItem('arcade-lowend', '1')
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: '#0a0014',
          color: '#ff5c8a', fontFamily: "'Press Start 2P', monospace",
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12 }}>SYSTEM ERROR</div>
          <div style={{ fontSize: 9, color: '#8fb6c9', maxWidth: 520 }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={this.enterLowEnd}
            style={{
              fontFamily: 'inherit', fontSize: 10, color: '#00f0ff', cursor: 'pointer',
              background: 'transparent', border: '1px solid #00f0ff', padding: '12px 18px',
              borderRadius: 4,
            }}
          >
            CONTINUE IN 2D MODE
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)