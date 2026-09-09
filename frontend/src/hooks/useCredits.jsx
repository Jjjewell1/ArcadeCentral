import { createContext, useContext, useState } from 'react'

const CreditsContext = createContext()

export function CreditsProvider({ children }) {
  const [credits, setCredits] = useState(0)
  const [recentGrab, setRecentGrab] = useState('')

  const addCredit = (title = '') => {
    setCredits((c) => c + 1)
    if (title) setRecentGrab(title)
  }

  return (
    <CreditsContext.Provider value={{ credits, addCredit, recentGrab }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  return useContext(CreditsContext)
}
