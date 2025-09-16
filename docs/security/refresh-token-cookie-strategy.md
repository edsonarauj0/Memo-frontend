# Estratégia para mascarar o refresh token no cookie

Este documento descreve uma abordagem prática para evitar que o refresh token `8lqztF3u92SDXqwnN6lJ1jNHmPhSGQZmARk-JfSvMx5kufaRNRtOU4ZNstgIjah7XFcvFc8ajQlhNWM50YbqMw` (ou qualquer outro token emitido) seja exposto em texto puro no cookie de sessão. A solução proposta prioriza que o frontend continue sem acesso direto ao valor real do refresh token e que qualquer dado armazenado no cookie seja inútil fora do backend.

## Objetivos da solução

1. **Mascarar o token** antes de enviá-lo ao navegador.
2. **Tornar o valor do cookie ilegível** sem a chave secreta do backend.
3. **Permitir a rotação transparente dos tokens** sempre que houver um refresh.
4. **Aplicar flags de cookie seguras** para minimizar vazamentos via XSS ou interceptação.

## Visão geral da arquitetura

1. O backend gera o refresh token "real" (`tokenReal`).
2. Antes de enviá-lo ao cliente, o backend criptografa o token usando uma chave simétrica exclusiva do servidor (`REFRESH_TOKEN_ENCRYPTION_KEY`).
3. O backend armazena **apenas um hash** do `tokenReal` no banco de dados, associado ao usuário e ao identificador do token.
4. O backend envia ao navegador um cookie HttpOnly contendo o token mascarado (criptografado), nunca o valor original.
5. Ao receber um pedido de refresh, o backend decodifica e valida o token, comparando o hash com o armazenado. Em seguida, gera novos tokens e repete o processo de mascaramento.

## Fluxo detalhado

1. **Geração do token real**
   ```ts
   import { randomBytes } from 'crypto'

   const tokenReal = randomBytes(64).toString('base64url')
   ```

2. **Criptografia para mascaramento**
   ```ts
   import { createCipheriv, randomBytes } from 'crypto'

   const chave = Buffer.from(process.env.REFRESH_TOKEN_ENCRYPTION_KEY!, 'hex') // 32 bytes
   const iv = randomBytes(12) // recomendado para AES-256-GCM

   const cipher = createCipheriv('aes-256-gcm', chave, iv)
   const ciphertext = Buffer.concat([cipher.update(tokenReal, 'utf8'), cipher.final()])
   const authTag = cipher.getAuthTag()

   const tokenMascarado = Buffer.concat([iv, authTag, ciphertext]).toString('base64url')
   ```

3. **Persistência segura**
   ```ts
   import { createHash } from 'crypto'

   const tokenHash = createHash('sha512').update(tokenReal).digest('hex')

   await prisma.refreshToken.create({
     data: {
       id: randomUUID(),
       userId: usuario.id,
       tokenHash,
       userAgentHash: createHash('sha256').update(req.headers['user-agent'] ?? '').digest('hex'),
       ipHash: createHash('sha256').update(realIp).digest('hex'),
       expiresAt: addDays(new Date(), 30),
     },
   })
   ```

4. **Envio do cookie mascarado**
   ```ts
   reply.setCookie('memo.rt', tokenMascarado, {
     httpOnly: true,
     secure: true,
     sameSite: 'strict',
     path: '/auth',
     maxAge: 60 * 60 * 24 * 30, // 30 dias
   })
   ```

5. **Validação no refresh**
   ```ts
   import { createDecipheriv } from 'crypto'

   const cookie = request.cookies['memo.rt']
   if (!cookie) throw new UnauthorizedError()

   const buffer = Buffer.from(cookie, 'base64url')
   const iv = buffer.subarray(0, 12)
   const authTag = buffer.subarray(12, 28)
   const ciphertext = buffer.subarray(28)

   const decipher = createDecipheriv('aes-256-gcm', chave, iv)
   decipher.setAuthTag(authTag)
   const tokenReal = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')

   const tokenHash = createHash('sha512').update(tokenReal).digest('hex')
   const registro = await prisma.refreshToken.findUnique({ where: { tokenHash } })
   if (!registro) throw new UnauthorizedError()
   ```

6. **Rotação**
   - Sempre que o refresh ocorrer com sucesso, gere um novo `tokenReal`.
   - Invalide (delete) o hash anterior e salve o hash do novo token.
   - Criptografe o novo token e sobrescreva o cookie.

## Benefícios

- **Cookies vazados tornam-se inúteis** sem a chave de criptografia.
- **Mesmo o banco de dados permanece seguro**, pois armazena apenas hashes. Um vazamento não entrega o token em si.
- **Flags de cookie restritivas** reduzem o risco de XSS e ataques de CSRF.
- **Associação com impressões digitais (UA/IP)** dificulta uso indevido a partir de outro dispositivo.

## Considerações adicionais

- Utilize uma chave de 256 bits armazenada em um cofre de segredos (Vault, AWS KMS, etc.).
- Faça rotação periódica da chave simétrica; mantenha versões antigas durante o período de validade dos tokens para suportar migração suave.
- Monitore a quantidade de refresh por dispositivo e bloqueie padrões suspeitos.
- Combine essa estratégia com limites de IP, detecção de anomalias e MFA para elevar o nível geral de segurança.
- Garanta que o endpoint de refresh aceite apenas `POST` com `SameSite=Strict` ou verificação de CSRF baseada em token separado.

Seguindo este desenho, o frontend continua operando sem alterações — o cookie HttpOnly é administrado pelo backend — enquanto o valor persistido no navegador está mascarado, mitigando o risco de exposição do refresh token real.

## Implementação utilitária neste repositório

Para facilitar a adoção prática, o repositório inclui o módulo `server/security/refresh-token.ts`, responsável por aplicar esta estratégia com AES-256-GCM e hash SHA-512. As funções expostas permitem mascarar o refresh token, gerar o cookie endurecido e validar o valor recebido em requisições subsequentes:

```ts
import {
  createMaskedRefreshTokenCookie,
  extractMaskedTokenFromCookies,
  verifyMaskedRefreshToken,
} from '../../server/security/refresh-token'

const encryptionKey = process.env.REFRESH_TOKEN_ENCRYPTION_KEY!

// Durante o login
const { cookie, tokenHash } = createMaskedRefreshTokenCookie(refreshTokenGerado, encryptionKey)
reply.header('Set-Cookie', cookie)
await refreshTokenRepository.save({ tokenHash, userId })

// Durante o refresh
const maskedToken = extractMaskedTokenFromCookies(request.headers.cookie)
if (!maskedToken) throw new UnauthorizedError()

const verification = verifyMaskedRefreshToken({
  maskedToken,
  expectedHash: registro.tokenHash,
  key: encryptionKey,
})
if (!verification.valid) throw new UnauthorizedError()
```

Os testes automatizados em `server/security/refresh-token.test.ts` cobrem o fluxo completo usando o refresh token de exemplo fornecido, garantindo que o valor mascarado só possa ser revertido com a chave legítima e que a comparação do hash ocorra em tempo constante.

