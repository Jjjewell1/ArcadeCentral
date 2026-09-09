import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import SearchFilters, { useSearchFilters } from '../components/SearchFilters.jsx'
import GameCard from '../components/GameCard.jsx'

const MAX_CARDS = 60

export default function Search() {
  const [params] = useSearchParams()
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [currentQuery, setCurrentQuery] = useState(params.get('q') || '')
  const { filters, apply, set } = useSearchFilters()

  const filtered = useMemo(
    () => apply(results, MAX_CARDS),
    [apply, results],
  )

  return (
    <div className="content">
      <h1>&#9679; TICKET COUNTER - SEARCH ALL INDEXERS</h1>
      <SearchBar
        initialQuery={currentQuery}
        onResults={(data) => {
          const list = Array.isArray(data) ? data : (data?.candidates || data?.items || [])
          setResults(list)
          setSearched(true)
        }}
      />

      {searched && results.length === 0 ? (
        <div className="empty">NO RELEASES FOUND - TRY AGAIN</div>
      ) : results.length > 0 ? (
        <>
          <SearchFilters results={results} filters={filters} set={set} />
          <div className="result-count">
            <span>SHOWING {filtered.shown} OF {filtered.total} MATCHES</span>
            {filtered.capped && <span className="muted">(CAPPED AT {MAX_CARDS} &mdash; ADD FILTERS TO NARROW)</span>}
          </div>
          <div className="grid">
            {filtered.list.slice(0, MAX_CARDS).map((r, i) => (
              <GameCard key={r.indexer_guid || r.id || i} game={r} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-card">
          <div className="empty-title">INSERT A QUERY TO BROWSE THE INDEXERS</div>
          <p className="empty-sub">
            Secret sauce: filters appear once results land. Min seeders, size windows,
            region and format chips, seeded-only &mdash; all saved for next time.
          </p>
        </div>
      )}
    </div>
  )
}