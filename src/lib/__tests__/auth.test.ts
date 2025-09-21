
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthSession, User } from '../../types/auth'

describe('auth session persistence', () => {
    let authModule: typeof import('../auth')

    const createUser = (): User => ({
        email: 'user@example.com',
        nome: 'John',
        sobrenome: 'Doe',
        sexo: null,
        cidade: null,
        role: null,
        diasEstudos: null,
        primeiroDiaSemana: null,
        periodoRevisao: null,
        classificacaoPerformance: null,
        foto: null,
        projetos: null,
    })

    const createSession = (): AuthSession => ({
        accessToken: 'token-123',
        user: createUser(),
    })

    beforeEach(async () => {
        vi.resetModules()
        window.localStorage.clear()
        authModule = await import('../auth')
    })

    it('persists the session to localStorage when saved', () => {
        const session = createSession()
        authModule.saveAuthSession(session)

        const raw = window.localStorage.getItem(authModule.AUTH_STORAGE_KEY)
        expect(raw).toEqual(JSON.stringify(session))
    })

    it('restores the session from localStorage when memory is empty', () => {
        const session = createSession()
        window.localStorage.setItem(authModule.AUTH_STORAGE_KEY, JSON.stringify(session))

        const restored = authModule.loadAuthSession()
        expect(restored).toEqual(session)
    })

    it('removes the persisted session on clear', () => {
        const session = createSession()
        authModule.saveAuthSession(session)

        authModule.clearAuthSession()
        expect(window.localStorage.getItem(authModule.AUTH_STORAGE_KEY)).toBeNull()
        expect(authModule.loadAuthSession()).toBeNull()
    })

    it('ignores malformed stored sessions', () => {
        window.localStorage.setItem(authModule.AUTH_STORAGE_KEY, 'not-json')

        const restored = authModule.loadAuthSession()
        expect(restored).toBeNull()
        expect(window.localStorage.getItem(authModule.AUTH_STORAGE_KEY)).toBeNull()
    })
})
