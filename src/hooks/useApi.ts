import { useState } from 'react'

export function useApi<T>(request: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const execute = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await request()
      setData(response)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, execute }
}
