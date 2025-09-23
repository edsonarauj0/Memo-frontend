import { Menu } from "@/components/sidebar/app-sidebar"
import { useProjetoDetalhado } from "@/hooks/useProjetoDetalhado"

export default function ProjetoPage() {
  const { projeto, isLoading, erro } = useProjetoDetalhado()

  const disciplinas = projeto?.materias ?? []
  const titulo = projeto?.nome ?? "Projeto"
  const descricao = projeto?.descricao

  return (
    <Menu header={<h1 className="text-xl font-semibold">{titulo}</h1>}>
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
