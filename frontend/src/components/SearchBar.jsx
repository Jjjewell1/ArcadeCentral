import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sfx } from '../audio.js'
import useApi from '../hooks/useApi.js'
import { useCredits } from '../hooks/useCredits.jsx'

export default function SearchBar({ onResults, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const { request, loading, error } = useApi()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    sfx.coin()
    try {
      const data = await request('/romarr/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
      })
      onResults && onResults(data)
    } catch {
      sfx.error()
    }
  }

  return (
    <form className="searchbar" onSubmit={handleSearch}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); sfx.blip() }}
        placeholder="SEARCH ALL INDEXERS..."
      />
      <button type="submit">
        {loading ? 'PROBING...' : 'SEARCH'}
      </button>
    </form>
  )
}
