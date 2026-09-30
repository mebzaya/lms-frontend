import axios from 'axios'
import { getToken, setToken, clearToken } from './tokenStorage'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A JWT's access-token TTL (60 minutes here) is much shorter than a
// realistic active session — a teacher stepping through a multi-question
// form, or grading several students one by one, can easily run past it
// while still very much "using" the app. jwt-auth's /auth/refresh endpoint
// accepts a token even after it has expired (as long as it's within the
// much longer refresh window), so on a 401 we exchange it for a fresh token
// and silently retry the original request instead of bouncing the user to
// the login screen mid-task.
//
// Shared across concurrent 401s so a burst of requests that all expire at
// once triggers exactly one /auth/refresh call — every other failed
// request just waits on this same promise and retries with its result.
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh`, null, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      })
      .then((res) => {
        setToken(res.data.access_token)
        return res.data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthRoute = config?.url === '/auth/login' || config?.url === '/auth/refresh'

    if (response?.status === 401 && getToken() && !isAuthRoute && !config._retriedAfterRefresh) {
      config._retriedAfterRefresh = true
      try {
        const newToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${newToken}`
        return apiClient(config)
      } catch {
        clearToken()
        return Promise.reject(error)
      }
    }

    if (response?.status === 401) {
      clearToken()
    }

    return Promise.reject(error)
  }
)

export default apiClient
