import { useEffect, useMemo, useState } from 'react'
import { sfx } from '../audio.js'

const STORAGE_KEY = 'arcade-search-filters'

const DEFAULT = {
  sort: 'relevance',
  minSeeders: 0,
  sizeMinGb: '',
  sizeMaxGb: '',
  regions: [],
  formats: [],
  seededOnly: false,
}

function loadFilters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT
}

export function useSearchFilters() {
  const [filters, setFilters] = useState(loadFilters)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  const apply = useMemo(() => {
    return (results, rawLimit) => {
      let list = [...results]
      if (filters.seededOnly) list = list.filter((r) => (r.seeders ?? 0) > 0)
      if (filters.minSeeders > 0) list = list.filter((r) => (r.seeders ?? 0) >= filters.minSeeders)
      if (filters.sizeMinGb) list = list.filter((r) => r.size_bytes >= parseFloat(filters.sizeMinGb) * 1024 ** 3)
      if (filters.sizeMaxGb) list = list.filter((r) => r.size_bytes <= parseFloat(filters.sizeMaxGb) * 1024 ** 3)
      if (filters.regions.length) list = list.filter((r) => filters.regions.includes(r.region))
      if (filters.formats.length) list = list.filter((r) => filters.formats.includes(r.file_format))
      switch (filters.sort) {
        case 'seeds': list.sort((a, b) => (b.seeders ?? 0) - (a.seeders ?? 0)); break
        case 'size-desc': list.sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0)); break
        case 'size-asc': list.sort((a, b) => (a.size_bytes ?? 0) - (b.size_bytes ?? 0)); break
        case 'title': list.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || '')); break
        default: break
      }
      const capped = rawLimit && list.length > rawLimit
      return { list, shown: capped ? rawLimit : list.length, total: list.length, capped }
    }
  }, [filters])

  const updater = (patch) => { sfx.blip(); setFilters((f) => ({ ...f, ...patch })) }

  return { filters, apply, set: updater }
}

export default function SearchFilters({ results, filters, set }) {
  const regions = useMemo(() => [...new Set(results.map((r) => r.region).filter(Boolean))].sort(), [results])
  const formats = useMemo(() => [...new Set(results.map((r) => r.file_format).filter(Boolean))].sort(), [results])

  const toggle = (key, value) => {
    const arr = filters[key]
    set({ [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] })
  }

  const reset = () => {
    sfx.coin()
    set({ sort: 'relevance', minSeeders: 0, sizeMinGb: '', sizeMaxGb: '', regions: [], formats: [], seededOnly: false })
  }

  return (
    <div className="filters">
      <div className="filter-row">
        <label className="filter-label">SORT</label>
        <select value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="relevance">RELEVANCE</option>
          <option value="seeds">SEEDERS (HIGH FIRST)</option>
          <option value="size-desc">SIZE (BIGGEST)</option>
          <option value="size-asc">SIZE (SMALLEST)</option>
          <option value="title">TITLE A&#8211;Z</option>
        </select>
      </div>

      <div className="filter-row nums">
        <label className="filter-label">MIN SEEDERS</label>
        <input
          type="number" min="0"
          value={filters.minSeeders}
          onChange={(e) => set({ minSeeders: Math.max(0, parseInt(e.target.value || '0', 10)) })}
        />
      </div>

      <div className="filter-row nums">
        <label className="filter-label">SIZE (GB)</label>
        <input
          type="number" min="0" step="0.1" placeholder="MIN"
          value={filters.sizeMinGb}
          onChange={(e) => set({ sizeMinGb: e.target.value })}
        />
        <span className="filter-dash">&ndash;</span>
        <input
          type="number" min="0" step="0.1" placeholder="MAX"
          value={filters.sizeMaxGb}
          onChange={(e) => set({ sizeMaxGb: e.target.value })}
        />
      </div>

      <div className="filter-toggle">
        <label>
          <input
            type="checkbox"
            checked={filters.seededOnly}
            onChange={(e) => set({ seededOnly: e.target.checked })}
          />
          <span>SEEDED ONLY</span>
        </label>
      </div>

      {regions.length > 1 && (
        <div className="filter-row">
          <label className="filter-label">REGION</label>
          <div className="chip-wrap">
            {regions.map((r) => (
              <button
                key={r}
                className={`chip ${filters.regions.includes(r) ? 'active' : ''}`}
                onClick={() => toggle('regions', r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {formats.length > 1 && (
        <div className="filter-row">
          <label className="filter-label">FORMAT</label>
          <div className="chip-wrap">
            {formats.map((f) => (
              <button
                key={f}
                className={`chip ${filters.formats.includes(f) ? 'active' : ''}`}
                onClick={() => toggle('formats', f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filters-foot">
        <button className="chip reset" onClick={reset}>RESET FILTERS</button>
      </div>
    </div>
  )
}