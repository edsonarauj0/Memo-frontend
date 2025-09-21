import httpClient from "./axios"
import type { Projeto } from "@/types/auth"

export interface CreateProjetoPayload {
  nome: string
  descricao?: string | null
  organizacao: string
  cargo: string
}

export type CreateProjetoResponse = Projeto

export async function createProjeto(payload: CreateProjetoPayload): Promise<CreateProjetoResponse> {
  return httpClient.post<CreateProjetoResponse>({
    url: "/projeto",
    data: payload,
  })
}
