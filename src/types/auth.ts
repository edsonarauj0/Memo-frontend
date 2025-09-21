export interface ClassificacaoPerformance {
  ruimMax: number
  regularMax: number
}

export interface Materia {
  id: number
  nome: string
  descricao: string | null
  cor: string | null
  isActive: boolean
  icon: React.ReactNode
  url?: string | null
  topicos?: Topico[] | null
}

export interface Topico {
  id: number
  nome: string
  descricao: string | null
  cor: string | null
  isActive: boolean
  url?: string | null
  icon: React.ReactNode
}

export interface Projeto {
  id: number
  nome: string
  descricao: string | null
  cargo: string | null
  editais: string | null
  imagemUrl: string | null
  materias?: Materia[] | null
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
  materias: Materia[] | null
  projetoSelecionadoId: number | null
}

export interface AuthSession {
  accessToken: string
  user: User | null
}
