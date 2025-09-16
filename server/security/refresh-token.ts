import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'

const KEY_LENGTH = 32
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const DEFAULT_COOKIE_NAME = 'memo.rt'

export type KeyInput = string | Buffer

export interface MaskRefreshTokenOptions {
  /** Optional initialization vector. Should be 12 bytes when provided. */
  iv?: Buffer
}

export interface MaskedRefreshToken {
  maskedToken: string
  tokenHash: string
}

export type SameSiteOption = 'strict' | 'lax' | 'none'

export interface CookieOptions {
  name?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: SameSiteOption
  path?: string
  domain?: string
  maxAgeSeconds?: number
}

export interface VerificationResult {
  valid: boolean
  refreshToken: string | null
  computedHash: string
}

export interface VerificationInput {
  maskedToken: string
  expectedHash: string
  key: KeyInput
}

function normalizeKey(keyInput: KeyInput): Buffer {
  if (Buffer.isBuffer(keyInput)) {
    if (keyInput.length !== KEY_LENGTH) {
      throw new Error(`Encryption key must be ${KEY_LENGTH} bytes long`)
    }
    return Buffer.from(keyInput)
  }

  const raw = keyInput.trim()
  const hexKey = decodeHexKey(raw)
  if (hexKey) {
    return hexKey
  }

  const base64Key = decodeBase64Key(raw)
  if (base64Key) {
    return base64Key
  }

  throw new Error(
    'Encryption key must be a 32-byte Buffer or a string encoded in hex, base64 or base64url.',
  )
}

function decodeHexKey(value: string): Buffer | null {
  if (!/^[\da-fA-F]+$/.test(value) || value.length !== KEY_LENGTH * 2) {
    return null
  }

  const key = Buffer.from(value, 'hex')
  return key.length === KEY_LENGTH ? key : null
}

function decodeBase64Key(value: string): Buffer | null {
  const candidates: Buffer[] = []
  try {
    candidates.push(Buffer.from(value, 'base64'))
  } catch {
    // ignored
  }

  try {
    candidates.push(Buffer.from(value, 'base64url'))
  } catch {
    // ignored
  }

  for (const candidate of candidates) {
    if (candidate.length === KEY_LENGTH) {
      return candidate
    }
  }

  return null
}

function getInitializationVector(options?: MaskRefreshTokenOptions): Buffer {
  if (options?.iv) {
    if (options.iv.length !== IV_LENGTH) {
      throw new Error(`Initialization vector must be ${IV_LENGTH} bytes long`)
    }
    return Buffer.from(options.iv)
  }

  return randomBytes(IV_LENGTH)
}

export function maskRefreshToken(
  refreshToken: string,
  keyInput: KeyInput,
  options?: MaskRefreshTokenOptions,
): MaskedRefreshToken {
  if (!refreshToken) {
    throw new Error('Refresh token must be a non-empty string')
  }

  const key = normalizeKey(keyInput)
  const iv = getInitializationVector(options)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(refreshToken, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  const maskedToken = Buffer.concat([iv, authTag, ciphertext]).toString('base64url')
  const tokenHash = hashRefreshToken(refreshToken)

  return { maskedToken, tokenHash }
}

export function revealRefreshToken(maskedToken: string, keyInput: KeyInput): string {
  if (!maskedToken) {
    throw new Error('Masked token must be a non-empty string')
  }

  const key = normalizeKey(keyInput)
  const payload = Buffer.from(maskedToken, 'base64url')
  if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Masked token payload is too short')
  }

  const iv = payload.subarray(0, IV_LENGTH)
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const refreshToken = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')

  return refreshToken
}

export function hashRefreshToken(refreshToken: string): string {
  if (!refreshToken) {
    throw new Error('Refresh token must be a non-empty string')
  }

  return createHash('sha512').update(refreshToken).digest('hex')
}

export function buildRefreshTokenCookie(
  maskedToken: string,
  options: CookieOptions = {},
): string {
  if (!maskedToken) {
    throw new Error('Masked token must be provided to build the cookie')
  }

  const {
    name = DEFAULT_COOKIE_NAME,
    httpOnly = true,
    secure = true,
    sameSite = 'strict',
    path = '/auth',
    domain,
    maxAgeSeconds = 60 * 60 * 24 * 30,
  } = options

  const cookieParts = [`${encodeURIComponent(name)}=${maskedToken}`]

  if (path) {
    cookieParts.push(`Path=${path}`)
  }

  if (domain) {
    cookieParts.push(`Domain=${domain}`)
  }

  if (Number.isFinite(maxAgeSeconds)) {
    cookieParts.push(`Max-Age=${Math.floor(maxAgeSeconds)}`)
  }

  if (sameSite) {
    cookieParts.push(`SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1).toLowerCase()}`)
  }

  if (secure) {
    cookieParts.push('Secure')
  }

  if (httpOnly) {
    cookieParts.push('HttpOnly')
  }

  return cookieParts.join('; ')
}

export function createMaskedRefreshTokenCookie(
  refreshToken: string,
  keyInput: KeyInput,
  options?: CookieOptions & MaskRefreshTokenOptions,
): MaskedRefreshToken & { cookie: string } {
  const { maskedToken, tokenHash } = maskRefreshToken(refreshToken, keyInput, options)
  const cookie = buildRefreshTokenCookie(maskedToken, options)

  return { maskedToken, tokenHash, cookie }
}

export function extractMaskedTokenFromCookies(
  cookieHeader: string | undefined,
  cookieName: string = DEFAULT_COOKIE_NAME,
): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (!name || value === undefined) {
      continue
    }

    if (name.trim() === cookieName) {
      return value.trim()
    }
  }

  return null
}

export function verifyMaskedRefreshToken({
  maskedToken,
  expectedHash,
  key,
}: VerificationInput): VerificationResult {
  const refreshToken = revealRefreshToken(maskedToken, key)
  const computedHash = hashRefreshToken(refreshToken)

  const expected = Buffer.from(expectedHash, 'hex')
  const computed = Buffer.from(computedHash, 'hex')

  if (expected.length !== computed.length) {
    return {
      valid: false,
      refreshToken: null,
      computedHash,
    }
  }

  const valid = timingSafeEqual(expected, computed)
  return {
    valid,
    refreshToken: valid ? refreshToken : null,
    computedHash,
  }
}

export const constants = {
  KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  DEFAULT_COOKIE_NAME,
}

