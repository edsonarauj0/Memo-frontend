import { Menu } from "@/components/sidebar/app-sidebar"
import { useProjetoDetalhado } from "@/hooks/useProjetoDetalhado"

export default function Materia() {
  const { projeto, isLoading, erro } = useProjetoDetalhado()
  const materias = projeto?.materias ?? []

  return (
    <Menu header={<h1 className="text-xl font-semibold">Matérias</h1>}>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-muted-foreground">Carregando matérias...</span>
        </div>
      ) : erro ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Não foi possível carregar as matérias.</h2>
          <p className="text-sm text-muted-foreground">{erro}</p>
        </div>
      ) : materias.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Matérias vinculadas ao projeto {projeto?.nome ?? "selecionado"}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] table-auto border-collapse text-left">
              <thead>
                <tr className="border-b bg-muted/50 text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Cor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {materias.map(materia => (
                  <tr key={materia.id} className="text-sm">
                    <td className="px-4 py-3 font-medium text-foreground">{materia.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {materia.descricao ? materia.descricao : "Sem descrição"}
                    </td>
                    <td className="px-4 py-3">
                      {materia.cor ? (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: materia.cor }} />
                          <span className="text-xs text-muted-foreground">{materia.cor}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não definida</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          materia.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {materia.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold">Nenhuma matéria cadastrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre uma nova matéria para visualizar aqui.
          </p>
        </div>
      )}
    </Menu>
  )
}
