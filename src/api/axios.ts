import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  clearAuthSession,
  loadAuthSession,
  updateAuthSession,
} from '../lib/auth'
import type { AuthSession, User } from '../types/auth'

interface RequestOptions {
  url: string
  data?: unknown
  params?: Record<string, unknown>
  extraHeaders?: Record<string, string>
}

type AxiosRequestConfigWithRetry = AxiosRequestConfig & { _retry?: boolean }

interface RefreshResponse {
  accessToken?: string | null
  refreshToken?: string | null
  user?: User | null
}

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:8080/api'
const REFRESH_ENDPOINT = '/auth/auth/refresh'

class AxiosClient {
  private static instance: AxiosClient

  private axiosInstance: AxiosInstance

  private authToken: string | null = null

  private refreshPromise: Promise<string | null> | null = null

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    const storedSession = loadAuthSession()
    if (storedSession) {
      this.authToken = storedSession.accessToken
    }

    this.axiosInstance.interceptors.request.use(config => this.attachAuthorizationHeader(config))
    this.axiosInstance.interceptors.response.use(
      response => this.handleResponseSuccess(response),
      error => this.handleResponseError(error),
    )
  }

  public static getInstance(): AxiosClient {
    if (!AxiosClient.instance) {
      AxiosClient.instance = new AxiosClient()
    }
    return AxiosClient.instance
  }

  public setAuthTokens(accessToken: string | null): void {
    this.authToken = accessToken
  }

  private attachAuthorizationHeader(config: InternalAxiosRequestConfig) {
    if (this.authToken) {
      config.headers = config.headers ?? {}
      ;(config.headers as Record<string, unknown>).Authorization = `Bearer ${this.authToken}`
    }

    return config
  }

  private async handleResponseError(error: unknown) {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as AxiosRequestConfigWithRetry

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        const newAccessToken = await this.refreshAccessToken()
        if (!newAccessToken) {
          throw this.normalizeError(error)
        }

        originalRequest.headers = originalRequest.headers ?? {}
        ;(originalRequest.headers as Record<string, unknown>).Authorization = `Bearer ${newAccessToken}`
        return this.axiosInstance(originalRequest)
      } catch (refreshError) {
        return Promise.reject(this.normalizeError(refreshError))
      }
    }

    if (originalRequest?.url?.includes('/auth/refresh')) {
      this.setAuthTokens(null)
      clearAuthSession()
    }

    return Promise.reject(this.normalizeError(error))
  }

  private handleResponseSuccess<T>(response: AxiosResponse<T>): AxiosResponse<T> {
    const newAccessToken = this.extractAccessTokenFromHeaders(response.headers)

    if (newAccessToken && newAccessToken !== this.authToken) {
      this.setAuthTokens(newAccessToken)
      updateAuthSession({ accessToken: newAccessToken })
    }

    return response
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.axiosInstance
        .post<RefreshResponse>(
          REFRESH_ENDPOINT,
          undefined,
          { _retry: true } as AxiosRequestConfigWithRetry,
        )
        .then(response => {
          const headerAccessToken = this.extractAccessTokenFromHeaders(response.headers)
          const { accessToken: bodyAccessToken, user } = response.data
          const accessToken = headerAccessToken ?? bodyAccessToken

          if (!accessToken) {
            throw new Error('Access token not provided by refresh endpoint')
          }

          this.setAuthTokens(accessToken)
          const sessionUpdate: Partial<AuthSession> = { accessToken }
          if (user !== undefined) {
            sessionUpdate.user = user ?? null
          }
          updateAuthSession(sessionUpdate)
          return accessToken
        })
        .catch(refreshError => {
          this.setAuthTokens(null)
          clearAuthSession()
          throw this.normalizeError(refreshError)
        })
        .finally(() => {
          this.refreshPromise = null
        })
    }

    return this.refreshPromise
  }

  private mergeHeaders(extraHeaders?: Record<string, string>) {
    return { ...(extraHeaders ?? {}) }
  }

  private extractAccessTokenFromHeaders(headers: AxiosResponse['headers']): string | null {
    if (!headers) {
      return null
    }

    const normalizedHeaders = headers as Record<string, string | string[] | undefined>
    const authorizationHeader = this.getFirstHeaderValue(
      normalizedHeaders['authorization'] ?? normalizedHeaders['Authorization'],
    )
    const accessTokenHeader = this.getFirstHeaderValue(
      normalizedHeaders['x-access-token'] ?? normalizedHeaders['X-Access-Token'],
    )

    if (authorizationHeader && authorizationHeader.toLowerCase().startsWith('bearer ')) {
      return authorizationHeader.slice(7).trim() || null
    }

    if (accessTokenHeader && accessTokenHeader.trim().length > 0) {
      return accessTokenHeader.trim()
    }

    return null
  }

  private getFirstHeaderValue(value: string | string[] | undefined): string | null {
    if (!value) {
      return null
    }

    if (Array.isArray(value)) {
      return value.find(item => typeof item === 'string' && item.trim().length > 0)?.trim() ?? null
    }

    return typeof value === 'string' ? value.trim() : null
  }

  private normalizeError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const { data, status } = error.response
        if (data && typeof data === 'object') {
          if ('message' in (data as Record<string, unknown>)) {
            const message = (data as Record<string, unknown>).message
            if (typeof message === 'string') {
              return new Error(message)
            }
          }
          return new Error(JSON.stringify(data))
        }

        if (typeof data === 'string') {
          return new Error(data)
        }

        return new Error(`Request failed with status ${status}`)
      }

      if (error.request) {
        return new Error('No response received from the server')
      }

      return new Error(error.message || 'Error setting up request')
    }

    if (error instanceof Error) {
      return error
    }

    return new Error('An unexpected error occurred')
  }

  private handleRequestError(error: unknown): never {
    throw this.normalizeError(error)
  }

  public async get<T = unknown>({ url, params, extraHeaders }: RequestOptions): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.axiosInstance.get(url, {
        params,
        headers: this.mergeHeaders(extraHeaders),
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }

  public async post<T = unknown>({
    url,
    data,
    params,
    extraHeaders,
  }: RequestOptions): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.axiosInstance.post(url, data, {
        params,
        headers: this.mergeHeaders(extraHeaders),
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }

  public async put<T = unknown>({
    url,
    data,
    params,
    extraHeaders,
  }: RequestOptions): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.axiosInstance.put(url, data, {
        params,
        headers: this.mergeHeaders(extraHeaders),
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }

  public async patch<T = unknown>({
    url,
    data,
    params,
    extraHeaders,
  }: RequestOptions): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.axiosInstance.patch(url, data, {
        params,
        headers: this.mergeHeaders(extraHeaders),
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }

  public async delete<T = unknown>({
    url,
    params,
    extraHeaders,
  }: RequestOptions): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.axiosInstance.delete(url, {
        params,
        headers: this.mergeHeaders(extraHeaders),
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }

  public async getBlob({
    url,
    params,
    extraHeaders,
  }: RequestOptions): Promise<Blob> {
    try {
      const res = await this.axiosInstance.get(url, {
        params,
        headers: this.mergeHeaders(extraHeaders),
        responseType: 'blob',
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }

  public async postBlob({
    url,
    data,
    params,
    extraHeaders,
  }: RequestOptions): Promise<Blob> {
    try {
      const res = await this.axiosInstance.post(url, data, {
        params,
        headers: this.mergeHeaders(extraHeaders),
        responseType: 'blob',
      })
      return res.data
    } catch (error) {
      this.handleRequestError(error)
    }
  }
}

export default AxiosClient.getInstance()

export type { RequestOptions }
