import { Menu } from "@/components/sidebar/app-sidebar"
import { useProjetoDetalhado } from "@/hooks/useProjetoDetalhado"
import { TableMaterias } from "./tableMaterias"

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
          <TableMaterias materias={materias} />
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
