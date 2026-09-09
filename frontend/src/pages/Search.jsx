import { useState } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import GameCard from '../components/GameCard.jsx'

export default function Search({ lowEnd }) {
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  return (
    <div className="content">
      <h1>&#9679; TICKET COUNTER - SEARCH ALL INDEXERS</h1>
      <SearchBar onResults={(data) => {
        setResults(Array.isArray(data) ? data : (data?.items || []))
        setSearched(true)
      }} />
      {searched && results.length === 0 ? (
        <div className="empty">NO RELEASES FOUND - TRY AGAIN</div>
      ) : results.length > 0 ? (
        <div className="grid">
          {results.map((r, i) => (
            <GameCard key={r.id || i} game={r} />
          ))}
        </div>
      ) : (
        <div className="empty">TYPE A QUERY AND PRESS SEARCH TO BROWSE THE INDEXERS</div>
      )}
    </div>
  )
}
