import httpClient from "./axios"
import type { Projeto } from "@/types/auth"

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
