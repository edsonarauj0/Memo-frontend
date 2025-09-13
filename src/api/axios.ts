import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

interface RequestOptions {
  url: string
  data?: unknown
  params?: Record<string, unknown>
  extraHeaders?: Record<string, string>
}

class AxiosClient {
  private static instance: AxiosClient

  private axiosInstance: AxiosInstance

  private authToken: string | null = null
  private refreshToken: string | null = null

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://localhost:8080/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.axiosInstance.interceptors.request.use(config => {
      if (this.authToken) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${this.authToken}`
      }
      return config
    })

    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean
        }
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.refreshToken
        ) {
          originalRequest._retry = true
          try {
            const res = await this.axiosInstance.post<{ accessToken: string }>(
              '/auth/refresh',
              { refreshToken: this.refreshToken },
            )
            const newToken = res.data.accessToken
            this.setAuthTokens(newToken, this.refreshToken)
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.axiosInstance(originalRequest)
          } catch (refreshError) {
            this.setAuthTokens(null, null)
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      },
    )
  }

  public static getInstance(): AxiosClient {
    if (!AxiosClient.instance) {
      AxiosClient.instance = new AxiosClient()
    }
    return AxiosClient.instance
  }

  public setAuthTokens(
    accessToken: string | null,
    refreshToken?: string | null,
  ): void {
    this.authToken = accessToken
    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken
    }
  }

  private mergeHeaders(extraHeaders?: Record<string, string>) {
    return { ...(extraHeaders || {}) }
  }

  public async get<T = unknown>({ url, params, extraHeaders }: RequestOptions): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.axiosInstance.get(url, {
        params,
        headers: this.mergeHeaders(extraHeaders),
      })
      return res.data
    } catch (error) {
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
    }
  }

  protected handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const responseData = error.response.data.message
        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'message' in (responseData as Record<string, unknown>)
        ) {
          throw new Error(String((responseData as Record<string, unknown>).message))
        }
        throw new Error(JSON.stringify(responseData))
      } else if (error.request) {
        throw new Error('No response received from the server')
      } else {
        throw new Error('Error setting up request')
      }
    }
    throw new Error('An unexpected error occurred')
  }
}

export default AxiosClient.getInstance()

export type { RequestOptions }

