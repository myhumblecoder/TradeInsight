import { useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Programmatic fetch wrapper that optionally attaches an Authorization header
 * using a provided getAccessToken function.
 */
export async function authFetch(
  input: RequestInfo,
  init?: RequestInit,
  getAccessToken?: () => Promise<string>
): Promise<Response> {
  const headers = new Headers((init?.headers as HeadersInit) || {})

  if (getAccessToken) {
    try {
      const token = await getAccessToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    } catch (err) {
      // If token resolution fails, we still proceed without Authorization header
      // Consumers can handle non-2xx responses as needed.
      console.warn(
        'authFetch: failed to obtain access token, continuing without Authorization header',
        err
      )
    }
  }

  const merged: RequestInit = {
    ...init,
    headers,
  }

  return fetch(input, merged)
}

/**
 * React hook convenience wrapper that uses the app's `useAuth()` to attach the
 * current access token automatically for requests made from components.
 */
export function useAuthFetch() {
  const { getAccessToken } = useAuth()
  return useCallback(
    (input: RequestInfo, init?: RequestInit) =>
      authFetch(input, init, getAccessToken),
    [getAccessToken]
  )
}

export default authFetch
