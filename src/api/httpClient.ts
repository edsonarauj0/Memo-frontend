export async function httpClient(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}
