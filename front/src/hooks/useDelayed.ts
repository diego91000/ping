import { useEffect, useState } from 'react'

export function useDelayed(active: boolean, delay = 200): boolean {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!active) {
      setShown(false)
      return
    }
    const timer = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(timer)
  }, [active, delay])

  return shown
}
