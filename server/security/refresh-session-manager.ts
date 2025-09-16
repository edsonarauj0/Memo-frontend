import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import {
  buildRefreshTokenClearingCookie,
  constants,
  createMaskedRefreshTokenCookie,
  extractMaskedTokenFromCookies,
  hashRefreshToken,
  revealRefreshToken,
  type CookieOptions,
  type KeyInput,
} from './refresh-token'

const DEFAULT_REFRESH_TOKEN_BYTES = 64
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const BASE_COOKIE_OPTIONS: CookieOptions = {
  name: constants.DEFAULT_COOKIE_NAME,
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/auth',
  maxAgeSeconds: DEFAULT_MAX_AGE_SECONDS,
}

export interface RefreshTokenMetadata {
  userAgent?: string | null
  ipAddress?: string | null
}

export interface RefreshTokenRecord {
  tokenHash: string
  userId: string
  expiresAt: Date
  userAgentHash?: string | null
  ipHash?: string | null
}

export interface RefreshTokenStore {
  save(record: RefreshTokenRecord): Promise<void> | void
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> | RefreshTokenRecord | null
  deleteByHash(tokenHash: string): Promise<void> | void
}

export interface IssueSessionOptions {
  userId: string
  metadata?: RefreshTokenMetadata
  cookieOverrides?: Partial<CookieOptions>
  now?: Date | number
}

export interface IssueSessionResult {
  cookie: string
  maskedToken: string
  refreshToken: string
  tokenHash: string
  expiresAt: Date
}

export interface ValidateSessionOptions {
  cookieHeader: string | undefined
  metadata?: RefreshTokenMetadata
  now?: Date | number
}

export type ValidateFailureReason =
  | 'missing-cookie'
  | 'decryption-failed'
  | 'unknown-token'
  | 'expired'
  | 'metadata-mismatch'

export type ValidateSessionResult =
  | { valid: true; tokenHash: string; refreshToken: string; record: RefreshTokenRecord }
  | { valid: false; reason: ValidateFailureReason }

export interface RotateSessionOptions extends ValidateSessionOptions {
  cookieOverrides?: Partial<CookieOptions>
}

export type RotateSessionResult =
  | ({ rotated: true; previousTokenHash: string } & IssueSessionResult)
  | { rotated: false; reason: ValidateFailureReason }

export interface RefreshSessionManagerOptions {
  encryptionKey: KeyInput
  tokenStore: RefreshTokenStore
  cookieOptions?: Partial<CookieOptions>
  refreshTokenBytes?: number
}

export class RefreshSessionManager {
  private readonly key: KeyInput

  private readonly store: RefreshTokenStore

  private readonly refreshTokenBytes: number

  private readonly cookieDefaults: CookieOptions

  private readonly cookieName: string

  constructor(options: RefreshSessionManagerOptions) {
    this.key = options.encryptionKey
    this.store = options.tokenStore
    this.refreshTokenBytes = options.refreshTokenBytes ?? DEFAULT_REFRESH_TOKEN_BYTES
    const sanitizedDefaults = this.sanitizeCookieOverrides(options.cookieOptions, true)
    this.cookieDefaults = { ...BASE_COOKIE_OPTIONS, ...sanitizedDefaults }
    this.cookieName = this.cookieDefaults.name ?? constants.DEFAULT_COOKIE_NAME
  }

  public async issueSession(options: IssueSessionOptions): Promise<IssueSessionResult> {
    const refreshToken = randomBytes(this.refreshTokenBytes).toString('base64url')
    const cookieOptions = this.mergeCookieOptions(options.cookieOverrides)
    const issuedAt = this.resolveNow(options.now)
    const maxAgeSeconds =
      cookieOptions.maxAgeSeconds ?? this.cookieDefaults.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS

    const { cookie, maskedToken, tokenHash } = createMaskedRefreshTokenCookie(
      refreshToken,
      this.key,
      cookieOptions,
    )

    const record: RefreshTokenRecord = {
      tokenHash,
      userId: options.userId,
      expiresAt: new Date(issuedAt + maxAgeSeconds * 1000),
      userAgentHash: this.hashOptionalMetadata(options.metadata?.userAgent),
      ipHash: this.hashOptionalMetadata(options.metadata?.ipAddress),
    }

    await this.store.save(record)

    return { cookie, maskedToken, refreshToken, tokenHash, expiresAt: record.expiresAt }
  }

  public async validateSession(options: ValidateSessionOptions): Promise<ValidateSessionResult> {
    const maskedToken = extractMaskedTokenFromCookies(options.cookieHeader, this.cookieName)
    if (!maskedToken) {
      return { valid: false, reason: 'missing-cookie' }
    }

    let refreshToken: string
    try {
      refreshToken = revealRefreshToken(maskedToken, this.key)
    } catch {
      return { valid: false, reason: 'decryption-failed' }
    }

    const tokenHash = hashRefreshToken(refreshToken)
    const record = await this.store.findByHash(tokenHash)
    if (!record) {
      return { valid: false, reason: 'unknown-token' }
    }

    if (!this.constantTimeEquals(record.tokenHash, tokenHash)) {
      return { valid: false, reason: 'unknown-token' }
    }

    const now = this.resolveNow(options.now)
    if (record.expiresAt.getTime() <= now) {
      await this.store.deleteByHash(record.tokenHash)
      return { valid: false, reason: 'expired' }
    }

    if (!this.metadataMatches(record, options.metadata)) {
      return { valid: false, reason: 'metadata-mismatch' }
    }

    return { valid: true, tokenHash, refreshToken, record }
  }

  public async rotateSession(options: RotateSessionOptions): Promise<RotateSessionResult> {
    const validation = await this.validateSession(options)
    if (!validation.valid) {
      return { rotated: false, reason: validation.reason }
    }

    await this.store.deleteByHash(validation.record.tokenHash)
    const issued = await this.issueSession({
      userId: validation.record.userId,
      metadata: options.metadata,
      cookieOverrides: options.cookieOverrides,
      now: options.now,
    })

    return { rotated: true, previousTokenHash: validation.record.tokenHash, ...issued }
  }

  public async revokeSessionByHash(tokenHash: string): Promise<void> {
    await this.store.deleteByHash(tokenHash)
  }

  public async revokeSessionFromCookie(options: ValidateSessionOptions): Promise<boolean> {
    const validation = await this.validateSession(options)
    if (!validation.valid) {
      return false
    }

    await this.store.deleteByHash(validation.tokenHash)
    return true
  }

  public buildRevocationCookie(overrides?: Partial<CookieOptions>): string {
    const cookieOptions = this.mergeCookieOptions(overrides)
    return buildRefreshTokenClearingCookie(cookieOptions)
  }

  private mergeCookieOptions(overrides?: Partial<CookieOptions>): CookieOptions {
    const base = { ...this.cookieDefaults }
    if (!overrides) {
      return base
    }

    const sanitized = this.sanitizeCookieOverrides(overrides, false)
    return { ...base, ...sanitized }
  }

  private sanitizeCookieOverrides(
    overrides: Partial<CookieOptions> | undefined,
    allowName: boolean,
  ): Partial<CookieOptions> {
    if (!overrides) {
      return {}
    }

    const result: Partial<CookieOptions> = {}
    for (const [key, value] of Object.entries(overrides) as [
      keyof CookieOptions,
      CookieOptions[keyof CookieOptions],
    ][]) {
      if (value === undefined) {
        continue
      }

      if (!allowName && key === 'name') {
        continue
      }

      result[key] = value
    }

    return result
  }

  private resolveNow(now?: Date | number): number {
    if (now instanceof Date) {
      return now.getTime()
    }

    if (typeof now === 'number') {
      return now
    }

    return Date.now()
  }

  private hashOptionalMetadata(value: string | null | undefined): string | null {
    if (!value) {
      return null
    }

    return createHash('sha256').update(value).digest('hex')
  }

  private metadataMatches(
    record: RefreshTokenRecord,
    metadata: RefreshTokenMetadata | undefined,
  ): boolean {
    if (record.userAgentHash) {
      if (!metadata?.userAgent) {
        return false
      }

      const hashedUserAgent = this.hashOptionalMetadata(metadata.userAgent)
      if (!hashedUserAgent || !this.constantTimeEquals(record.userAgentHash, hashedUserAgent)) {
        return false
      }
    }

    if (record.ipHash) {
      if (!metadata?.ipAddress) {
        return false
      }

      const hashedIp = this.hashOptionalMetadata(metadata.ipAddress)
      if (!hashedIp || !this.constantTimeEquals(record.ipHash, hashedIp)) {
        return false
      }
    }

    return true
  }

  private constantTimeEquals(expectedHex: string | null | undefined, actualHex: string | null | undefined): boolean {
    if (!expectedHex || !actualHex) {
      return false
    }

    const expected = Buffer.from(expectedHex, 'hex')
    const actual = Buffer.from(actualHex, 'hex')

    if (expected.length !== actual.length) {
      return false
    }

    return timingSafeEqual(expected, actual)
  }
}

