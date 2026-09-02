import { useEffect, useRef, useState } from 'react'
import { isOllamaReachable } from '../services/ollama'

export const CONNECTION_STATES = {
  CHECKING: 'checking',
  ONLINE: 'online',
  OFFLINE: 'offline',
}

export function useOllamaConnection({ intervalMs = 8000 } = {}) {
  const [state, setState] = useState(CONNECTION_STATES.CHECKING)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    async function check() {
      const reachable = await isOllamaReachable()
      if (cancelled || !mountedRef.current) return
      setState(reachable ? CONNECTION_STATES.ONLINE : CONNECTION_STATES.OFFLINE)
    }

    check()
    const timer = window.setInterval(check, intervalMs)

    return () => {
      cancelled = true
      mountedRef.current = false
      window.clearInterval(timer)
    }
  }, [intervalMs])

  return { state }
}