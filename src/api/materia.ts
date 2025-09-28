import type { Materia } from "@/types/auth";
import httpClient from "./axios"

export interface CreateMateriaPayload {
  nome: string
  cor: string | undefined
}

export async function adicionarMateria(projetoId: number, payload: CreateMateriaPayload): Promise<Materia> {
  return httpClient.post<Materia>({
    url: `/projeto/${projetoId}/materias`,
    data: payload,
  })
}

export async function excluirMateria(projetoId: number, materiaId: number): Promise<void> {
  return httpClient.delete<void>({
    url: `/projeto/${projetoId}/materias/${materiaId}`,
  })
}