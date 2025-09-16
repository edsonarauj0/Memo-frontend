import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  RefreshSessionManager,
  type IssueSessionResult,
  type RefreshSessionManagerOptions,
  type RefreshTokenRecord,
  type RefreshTokenStore,
} from './refresh-session-manager'

const KEY_HEX = '11'.repeat(32)

class InMemoryRefreshTokenStore implements RefreshTokenStore {
  private readonly records = new Map<string, RefreshTokenRecord>()

  public async save(record: RefreshTokenRecord): Promise<void> {
    this.records.set(record.tokenHash, { ...record })
  }

  public async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.records.get(tokenHash) ?? null
  }

  public async deleteByHash(tokenHash: string): Promise<void> {
    this.records.delete(tokenHash)
  }

  public get(tokenHash: string): RefreshTokenRecord | null {
    return this.records.get(tokenHash) ?? null
  }

  public size(): number {
    return this.records.size
  }
}

function createManager(
  options: Partial<RefreshSessionManagerOptions> = {},
): { manager: RefreshSessionManager; store: InMemoryRefreshTokenStore } {
  const store = new InMemoryRefreshTokenStore()
  const manager = new RefreshSessionManager({
    encryptionKey: KEY_HEX,
    tokenStore: store,
    ...options,
  })

  return { manager, store }
}

function expectSuccessfulRotation(result: IssueSessionResult & { rotated: true }): void {
  expect(result.cookie).toContain('memo.rt=')
  expect(result.tokenHash).toBeTypeOf('string')
  expect(result.maskedToken).toBeTypeOf('string')
  expect(result.refreshToken).toBeTypeOf('string')
}

describe('RefreshSessionManager', () => {
  it('issues masked refresh token cookies and stores hashed metadata', async () => {
    const { manager, store } = createManager()

    const metadata = { userAgent: 'test-agent', ipAddress: '203.0.113.42' }
    const result = await manager.issueSession({
      userId: 'user-123',
      metadata,
    })

    expect(result.cookie).toMatch(/^memo\.rt=/)
    expect(result.cookie).toContain('HttpOnly')
    expect(result.cookie).toContain('Secure')
    expect(result.cookie).toContain('SameSite=Strict')
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())

    const stored = store.get(result.tokenHash)
    expect(stored).not.toBeNull()
    expect(stored?.userId).toBe('user-123')
    expect(stored?.userAgentHash).toBe(createHash('sha256').update(metadata.userAgent!).digest('hex'))
    expect(stored?.ipHash).toBe(createHash('sha256').update(metadata.ipAddress!).digest('hex'))
  })

  it('validates sessions when metadata matches the stored hashes', async () => {
    const { manager } = createManager()
    const metadata = { userAgent: 'Mozilla/5.0', ipAddress: '198.51.100.23' }
    const issued = await manager.issueSession({ userId: 'user-42', metadata })

    const validation = await manager.validateSession({
      cookieHeader: `${issued.cookie}; theme=dark`,
      metadata,
    })

    expect(validation.valid).toBe(true)
    if (validation.valid) {
      expect(validation.record.userId).toBe('user-42')
      expect(validation.tokenHash).toBe(issued.tokenHash)
      expect(validation.refreshToken).toBeTypeOf('string')
    }
  })

  it('rejects tokens when device metadata mismatches', async () => {
    const { manager } = createManager()
    const issued = await manager.issueSession({
      userId: 'user-abc',
      metadata: { userAgent: 'Agent/1.0', ipAddress: '192.0.2.55' },
    })

    const validation = await manager.validateSession({
      cookieHeader: issued.cookie,
      metadata: { userAgent: 'Agent/1.0', ipAddress: '192.0.2.56' },
    })

    expect(validation.valid).toBe(false)
    if (!validation.valid) {
      expect(validation.reason).toBe('metadata-mismatch')
    }
  })

  it('invalidates and purges expired refresh sessions', async () => {
    const { manager, store } = createManager()
    const metadata = { userAgent: 'ExpireTest/1.0', ipAddress: '198.18.0.1' }
    const issued = await manager.issueSession({
      userId: 'user-exp',
      metadata,
      cookieOverrides: { maxAgeSeconds: 60 },
      now: new Date('2024-01-01T00:00:00Z'),
    })

    const validation = await manager.validateSession({
      cookieHeader: issued.cookie,
      metadata,
      now: new Date('2024-01-01T00:02:00Z'),
    })

    expect(validation.valid).toBe(false)
    if (!validation.valid) {
      expect(validation.reason).toBe('expired')
    }
    expect(store.size()).toBe(0)
  })

  it('rotates refresh sessions and replaces the stored hash', async () => {
    const { manager, store } = createManager()
    const metadata = { userAgent: 'RotateBot', ipAddress: '192.0.2.77' }
    const initial = await manager.issueSession({ userId: 'user-rotate', metadata })

    const rotation = await manager.rotateSession({
      cookieHeader: initial.cookie,
      metadata,
    })

    expect(rotation.rotated).toBe(true)
    if (rotation.rotated) {
      expect(rotation.previousTokenHash).toBe(initial.tokenHash)
      expect(rotation.tokenHash).not.toBe(initial.tokenHash)
      expectSuccessfulRotation(rotation)
    }

    expect(store.size()).toBe(1)
    const stored = store.get(rotation.rotated ? rotation.tokenHash : '')
    expect(stored?.userId).toBe('user-rotate')
    expect(store.get(initial.tokenHash)).toBeNull()
  })

  it('revokes sessions using the cookie payload and generates a clearing cookie', async () => {
    const { manager, store } = createManager()
    const metadata = { userAgent: 'LogoutBot', ipAddress: '203.0.113.199' }
    const issued = await manager.issueSession({ userId: 'user-logout', metadata })

    const revoked = await manager.revokeSessionFromCookie({
      cookieHeader: `${issued.cookie}; other=value`,
      metadata,
    })

    expect(revoked).toBe(true)
    expect(store.size()).toBe(0)

    const clearingCookie = manager.buildRevocationCookie()
    expect(clearingCookie).toContain('memo.rt=')
    expect(clearingCookie).toContain('Max-Age=0')
    expect(clearingCookie).toContain('HttpOnly')
  })
})

