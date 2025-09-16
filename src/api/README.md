# Cliente HTTP

Este diretório contém a implementação centralizada do cliente HTTP baseado em Axios.

## Uso básico

```ts
import httpClient from './axios'

export async function fetchUsers() {
  return httpClient.get<{ users: unknown[] }>({ url: '/users' })
}
```

## Definindo o token de acesso

Após autenticar o usuário, defina o token de acesso para que ele seja incluído nas próximas requisições. A renovação do token é realizada automaticamente pelo cookie HttpOnly fornecido pelo backend:

```ts
import httpClient from './axios'

httpClient.setAuthTokens('meu-access-token')
```

## Criando novas chamadas de API

1. Crie um arquivo de serviço em `src/api` ou em outro diretório de serviços.
2. Importe `httpClient`.
3. Utilize os métodos `get`, `post`, `put`, `patch`, `delete`, `getBlob` ou `postBlob`.
4. Cada método aceita um objeto `RequestOptions` com:
   - `url`: caminho do endpoint (obrigatório);
   - `data`: corpo da requisição (opcional);
   - `params`: parâmetros de consulta (opcional);
   - `extraHeaders`: cabeçalhos adicionais (opcional).

### Exemplo

```ts
import httpClient from './axios'

export async function fetchPosts(page: number) {
  return httpClient.get<{ posts: Post[] }>({
    url: '/posts',
    params: { page },
  })
}
```

Para uploads ou downloads de arquivos, utilize os métodos `postBlob` e `getBlob` respectivamente.

