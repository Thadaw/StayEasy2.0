import { useState, useEffect, useRef } from 'react'

const STRIPE_SCRIPT_URL = 'https://js.stripe.com/v3/'

export function useStripe() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (window.Stripe) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = STRIPE_SCRIPT_URL
    script.async = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setError('Failed to load Stripe')

    document.body.appendChild(script)
    scriptRef.current = script

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
    }
  }, [])

  return { isLoaded, error }
}
