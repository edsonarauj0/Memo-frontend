export interface ClassificacaoPerformance {
  ruimMax: number
  regularMax: number
}

export interface Projeto {
  id: number
  nome: string
  descricao: string | null
  cargo: string | null
  editais: string | null
  imagemUrl: string | null
}

export interface User {
  email: string
  nome: string
  sobrenome: string
  sexo: string | null
  cidade: string | null
  role: string | null
  diasEstudos: string[] | null
  primeiroDiaSemana: string | null
  periodoRevisao: number[] | null
  classificacaoPerformance: ClassificacaoPerformance | null
  foto: string | null
  projetos: Projeto[] | null
  projetoSelecionadoId: number | null
}

export interface AuthSession {
  accessToken: string
  user: User | null
}
