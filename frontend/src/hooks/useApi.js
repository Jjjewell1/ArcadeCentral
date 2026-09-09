import { useCallback, useEffect, useState } from 'react'

export default function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (path, options = {}, retry = 2) => {
    setLoading(true)
    setError(null)
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const res = await fetch('/api' + path, {
          headers: { 'Content-Type': 'application/json' },
          ...options,
        })
        if (!res.ok) {
          throw new Error(`API error ${res.status}`)
        }
        const data = await res.json()
        setLoading(false)
        return data
      } catch (err) {
        if (attempt === retry) {
          setError(err.message)
          setLoading(false)
          throw err
        }
        await new Promise((r) => setTimeout(r, 500))
      }
    }
  }, [])

  return { request, loading, error }
}
