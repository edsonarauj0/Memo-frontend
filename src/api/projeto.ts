import httpClient from "./axios"
import type { Materia, Projeto } from "@/types/auth"

export interface CreateProjetoPayload {
  nome: string
  descricao?: string | null
  organizacao: string
  cargo: string
}

export interface SelectProjetoPayload {
  projetoId: number
}

export interface SelectProjetoResponse {
  projetoSelecionadoId: number
}

export type CreateProjetoResponse = Projeto

export type ProjetoDetalhado = Projeto & {
  materias: Materia[] | null
}

export async function createProjeto(payload: CreateProjetoPayload): Promise<CreateProjetoResponse> {
  return httpClient.post<CreateProjetoResponse>({
    url: "/projeto",
    data: payload,
  })
}

export async function selecionarProjeto(payload: SelectProjetoPayload): Promise<SelectProjetoResponse> {
  return httpClient.post<SelectProjetoResponse>({
    url: "/projeto/selecionar",
    data: payload,
  })
}

export async function buscarProjetoPorId(projetoId: number): Promise<ProjetoDetalhado> {
  return httpClient.get<ProjetoDetalhado>({
    url: `/projeto/${projetoId}`,
  })
}
