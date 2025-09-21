import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Menu } from "@/components/sidebar/app-sidebar"
import { DEFAULT_PROJETO_ID } from "@/config/constants"
import { buscarProjetoPorId, type ProjetoDetalhado } from "@/api/projeto"
import { useAuth } from "@/hooks/useAuth"

function isValidProjetoId(id?: string): id is string {
  if (!id) {
    return false
  }
  const parsed = Number(id)
  return Number.isInteger(parsed) && parsed > 0
}

export default function ProjetoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projeto, setProjeto] = useState<ProjetoDetalhado | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidProjetoId(id)) {
      navigate(`/projeto/${DEFAULT_PROJETO_ID}`, { replace: true })
      return
    }

    const numericId = Number(id)

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
  }, [id, navigate, user?.projetos])

  const disciplinas = projeto?.materias ?? []
  const titulo = projeto?.nome ?? "Projeto"
  const descricao = projeto?.descricao
  return (
    <Menu
      header={<h1 className="text-xl font-semibold">{titulo}</h1>}
      materias={projeto?.materias ?? null}
      projetoSelecionado={projeto}
    >
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-muted-foreground">Carregando projeto...</span>
        </div>
      ) : erro ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Não foi possível carregar o projeto padrão.</h2>
          <p className="text-sm text-muted-foreground">{erro}</p>
        </div>
      ) : projeto ? (
        <div className="space-y-6">
          <section className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Informações do Projeto</p>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">{projeto.nome}</h2>
              {descricao ? <p className="mt-2 text-muted-foreground">{descricao}</p> : null}
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Cargo</dt>
                  <dd className="text-base font-semibold text-foreground">{projeto.cargo ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Editais</dt>
                  <dd className="text-base font-semibold text-foreground">{projeto.editais ?? "Não informado"}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Disciplinas</h3>
              <p className="text-sm text-muted-foreground">
                {disciplinas.length > 0
                  ? "Lista de disciplinas vinculadas a este projeto."
                  : "Nenhuma disciplina cadastrada para este projeto."}
              </p>
            </div>
            {disciplinas.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {disciplinas.map(disciplina => (
                  <li key={disciplina.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <h4 className="text-base font-semibold">{disciplina.nome}</h4>
                    {disciplina.descricao ? (
                      <p className="mt-2 text-sm text-muted-foreground">{disciplina.descricao}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </Menu>
  )
}
