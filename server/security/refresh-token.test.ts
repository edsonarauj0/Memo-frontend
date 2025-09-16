import { describe, expect, it } from 'vitest'
import {
  buildRefreshTokenCookie,
  buildRefreshTokenClearingCookie,
  constants,
  createMaskedRefreshTokenCookie,
  extractMaskedTokenFromCookies,
  hashRefreshToken,
  maskRefreshToken,
  revealRefreshToken,
  verifyMaskedRefreshToken,
} from './refresh-token'

const KEY_HEX = '11'.repeat(32)
const SAMPLE_REFRESH_TOKEN =
  '8lqztF3u92SDXqwnN6lJ1jNHmPhSGQZmARk-JfSvMx5kufaRNRtOU4ZNstgIjah7XFcvFc8ajQlhNWM50YbqMw'

const FIXED_IV = Buffer.from('000102030405060708090a0b', 'hex')

describe('refresh token masking helpers', () => {
  it('masks and reveals the refresh token deterministically when IV is fixed', () => {
    const { maskedToken, tokenHash } = maskRefreshToken(SAMPLE_REFRESH_TOKEN, KEY_HEX, {
      iv: FIXED_IV,
    })

    expect(maskedToken).not.toEqual(SAMPLE_REFRESH_TOKEN)
    expect(tokenHash).toEqual(hashRefreshToken(SAMPLE_REFRESH_TOKEN))

    const restored = revealRefreshToken(maskedToken, KEY_HEX)
    expect(restored).toEqual(SAMPLE_REFRESH_TOKEN)

    const payload = Buffer.from(maskedToken, 'base64url')
    expect(payload.subarray(0, constants.IV_LENGTH)).toEqual(FIXED_IV)
    expect(payload.length).toBeGreaterThan(constants.IV_LENGTH + constants.AUTH_TAG_LENGTH)
  })

  it('generates hardened cookie attributes by default', () => {
    const { maskedToken } = maskRefreshToken(SAMPLE_REFRESH_TOKEN, KEY_HEX, { iv: FIXED_IV })
    const cookie = buildRefreshTokenCookie(maskedToken)

    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/auth')
    expect(cookie).toMatch(/^memo\.rt=/)
  })

  it('builds a clearing cookie while preserving hardened attributes', () => {
    const clearingCookie = buildRefreshTokenClearingCookie({
      domain: 'example.com',
    })

    expect(clearingCookie).toMatch(/^memo\.rt=/)
    expect(clearingCookie).toContain('Path=/auth')
    expect(clearingCookie).toContain('Domain=example.com')
    expect(clearingCookie).toContain('Max-Age=0')
    expect(clearingCookie).toContain('HttpOnly')
    expect(clearingCookie).toContain('Secure')
    expect(clearingCookie).toContain('SameSite=Strict')
  })

  it('extracts masked token values from cookie headers', () => {
    const { maskedToken } = maskRefreshToken(SAMPLE_REFRESH_TOKEN, KEY_HEX, { iv: FIXED_IV })
    const cookieHeader = `${buildRefreshTokenCookie(maskedToken)}; theme=dark`
    const extracted = extractMaskedTokenFromCookies(cookieHeader)

    expect(extracted).toEqual(maskedToken)
  })

  it('verifies masked refresh tokens using a timing safe comparison', () => {
    const { maskedToken, tokenHash } = maskRefreshToken(SAMPLE_REFRESH_TOKEN, KEY_HEX, {
      iv: FIXED_IV,
    })

    const verification = verifyMaskedRefreshToken({
      maskedToken,
      expectedHash: tokenHash,
      key: KEY_HEX,
    })

    expect(verification.valid).toBe(true)
    expect(verification.refreshToken).toBe(SAMPLE_REFRESH_TOKEN)
    expect(verification.computedHash).toBe(tokenHash)

    const invalid = verifyMaskedRefreshToken({
      maskedToken,
      expectedHash: tokenHash.replace(/^./, '0'),
      key: KEY_HEX,
    })

    expect(invalid.valid).toBe(false)
    expect(invalid.refreshToken).toBeNull()
    expect(invalid.computedHash).toBe(tokenHash)
  })

  it('creates a full cookie payload while returning the masked token metadata', () => {
    const result = createMaskedRefreshTokenCookie(SAMPLE_REFRESH_TOKEN, KEY_HEX, {
      iv: FIXED_IV,
      maxAgeSeconds: 3600,
    })

    expect(result.cookie).toContain(`memo.rt=${result.maskedToken}`)
    expect(result.cookie).toContain('Max-Age=3600')
    expect(result.tokenHash).toEqual(hashRefreshToken(SAMPLE_REFRESH_TOKEN))
  })
})

