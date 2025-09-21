import * as React from "react"

import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar"
import type { Materia } from "@/types/auth"
import { Book, Folder, Forward, MoreHorizontal, Trash2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

type NavDisciplinasProps = {
  materias?: Materia[] | null
  projetoId?: number | null
}

export function NavMaterias({ materias, projetoId }: NavDisciplinasProps) {
  const lista = React.useMemo(
    () =>
      (materias ?? []).filter(
        (materia): materia is Materia => materia !== null && materia !== undefined,
      ),
    [materias],
  )
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const [materiaSelecionadaId, setMateriaSelecionadaId] = React.useState<number | null>(null)

  const materiasBasePath = React.useMemo(
    () => (projetoId != null ? `/projeto/${projetoId}/materias` : "/projeto/materias"),
    [projetoId],
  )

  const handleVerMaterias = React.useCallback(() => {
    navigate(materiasBasePath)
  }, [navigate, materiasBasePath])

  const handlePesquisarMaterias = React.useCallback(() => {
    navigate(`${materiasBasePath}/buscar`)
  }, [navigate, materiasBasePath])

  const iniciarFluxoConfirmacao = React.useCallback((materiaId: number) => {
    const confirmado = window.confirm("Tem certeza que deseja deletar esta matéria?")
    if (confirmado) {
      console.info("Matéria confirmada para exclusão:", materiaId)
    }
  }, [])

  React.useEffect(() => {
    if (lista.length === 0) {
      setMateriaSelecionadaId(null)
      return
    }

    setMateriaSelecionadaId((valorAtual) => {
      if (valorAtual != null && lista.some((materia) => materia.id === valorAtual)) {
        return valorAtual
      }

      return lista[0]?.id ?? null
    })
  }, [lista])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Materias</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to={materiasBasePath}>
              <Book />
              <span>Materia</span>
            </Link>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align={isMobile ? "end" : "start"}
            >
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handleVerMaterias()
                }}
              >
                <Folder className="text-muted-foreground" />
                <span>Ver materias</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handlePesquisarMaterias()
                }}
              >
                <Forward className="text-muted-foreground" />
                <span>Pesquisar materia</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  if (materiaSelecionadaId != null) {
                    iniciarFluxoConfirmacao(materiaSelecionadaId)
                  }
                }}
              >
                <Trash2 className="text-muted-foreground" />
                <span>Deletar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {lista.length > 0 ? (
            <SidebarMenuSub>
              {lista.map((materia) => (
                <SidebarMenuSubButton
                  asChild
                  key={materia.id}
                  onFocus={() => setMateriaSelecionadaId(materia.id)}
                  onMouseEnter={() => setMateriaSelecionadaId(materia.id)}
                >
                  <Link to={`${materiasBasePath}/${materia.id}`}>
                    {materia.icon ?? <Book />}
                    <span>{materia.nome}</span>
                  </Link>
                </SidebarMenuSubButton>
              ))}
            </SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
