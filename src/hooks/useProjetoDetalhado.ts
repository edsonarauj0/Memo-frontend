import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { buscarProjetoPorId, type ProjetoDetalhado } from "@/api/projeto"
import { DEFAULT_PROJETO_ID } from "@/config/constants"
import { useAuth } from "./useAuth"

function isValidProjetoId(id?: string): id is string {
  if (!id) {
    return false
  }

  const parsed = Number(id)
  return Number.isInteger(parsed) && parsed > 0
}

export function useProjetoDetalhado() {
  const { projetoId } = useParams<{ projetoId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projeto, setProjeto] = useState<ProjetoDetalhado | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidProjetoId(projetoId)) {
      navigate(`/projeto/${DEFAULT_PROJETO_ID}`, { replace: true })
      return
    }

    const numericId = Number(projetoId)

    if (user?.projetos && user.projetos.length > 0) {
      const projetoExiste = user.projetos.some(projetoAtual => projetoAtual.id === numericId)
      if (!projetoExiste) {
        navigate(`/projeto/${DEFAULT_PROJETO_ID}`, { replace: true })
        return
      }
    }

    let ativo = true
    setIsLoading(true)
    setErro(null)

    buscarProjetoPorId(numericId)
      .then(dadosProjeto => {
        if (!ativo) {
          return
        }

        setProjeto(dadosProjeto)
      })
      .catch(error => {
        if (!ativo) {
          return
        }

        const mensagem = error instanceof Error ? error.message : "Não foi possível carregar o projeto"
        if (numericId !== DEFAULT_PROJETO_ID) {
          navigate(`/projeto/${DEFAULT_PROJETO_ID}`, { replace: true })
          return
        }

        setErro(mensagem)
        setProjeto(null)
      })
      .finally(() => {
        if (ativo) {
          setIsLoading(false)
        }
      })

    return () => {
      ativo = false
    }
  }, [projetoId, navigate, user?.projetos])

  return { projeto, isLoading, erro }
}
