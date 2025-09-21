import * as React from "react"
import { ChevronsUpDown, Command, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar"
import { ModalAdicionarProjeto } from "./nav-modal-adicionar-projeto"  // Importe o modal aqui
import { selecionarProjeto } from "@/api/projeto"
import { useAuth } from "@/hooks/useAuth"
import { updateAuthSession } from "@/lib/auth"
import type { Projeto } from "@/types/auth"

type ProjetoSwitcherItem = {
  id: number
  nome: string
  plan: string | null
  logo: string | null
  descricao: string
  editais: string | null
}

export function ProjetoSwitcher({ projetos, projetoSelecionadoId }: { projetos: ProjetoSwitcherItem[], projetoSelecionadoId?: number }) {
  const { isMobile } = useSidebar();
  const [abrirModalAdicionarProjeto, setAbrirModalAdicionarProjeto] = React.useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projetoAtivo, setProjetoAtivo] = React.useState<ProjetoSwitcherItem | null>(

    () => projetos.find(projeto => projeto.id === projetoSelecionadoId) ?? projetos[0] ?? null,
  )

  React.useEffect(() => {
    if (projetos.length === 0) {
      setProjetoAtivo(null)
      return
    }

    setProjetoAtivo(current => {
      if (projetoSelecionadoId !== undefined) {
        const explicitProjeto = projetos.find(projeto => projeto.id === projetoSelecionadoId)
        if (explicitProjeto) {
          return explicitProjeto
        }
      }

      if (!current) {
        return projetos[0]
      }

      const nextProjeto = projetos.find(projeto => projeto.id === current.id)
      return nextProjeto ?? projetos[0]
    })
  }, [projetoSelecionadoId, projetos])

  const alterarProjeto = async (values: { projetoId: number }) => {
    if (values.projetoId) {
      const response = await selecionarProjeto({ projetoId: values.projetoId })
      const selectedProjetoId = response.projetoSelecionadoId ?? values.projetoId
      const nextProjetoAtivo = projetos.find(projeto => projeto.id === selectedProjetoId) ?? null

      if (user) {
        updateAuthSession({
          user: {
            ...user,
            projetoSelecionadoId: selectedProjetoId,
          },
        })
      }

      setProjetoAtivo(nextProjetoAtivo)
      navigate(`/projeto/${selectedProjetoId}`)
    }
  }

  const handleProjetoCriado = React.useCallback(
    (novoProjeto: Projeto) => {
      if (!user) {
        return
      }

      const projetosAtuais = user.projetos ?? []
      const projetosAtualizados = [...projetosAtuais, novoProjeto]

      updateAuthSession({
        user: {
          ...user,
          projetos: projetosAtualizados,
          projetoSelecionadoId: novoProjeto.id,
        },
      })

      setProjetoAtivo({
        id: novoProjeto.id,
        nome: novoProjeto.nome,
        plan: novoProjeto.cargo,
        logo: novoProjeto.imagemUrl,
        descricao: novoProjeto.descricao ?? "",
        editais: novoProjeto.editais,
      })

      navigate(`/projeto/${novoProjeto.id}`)
    },
    [navigate, user],
  )

  if (!projetoAtivo) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70" disabled>
            <Plus className="mr-2 size-4" />
            <span>Nenhum projeto disponível</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{projetoAtivo.nome}</span>
                <span className="truncate text-xs">{projetoAtivo.descricao}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            
            {projetos.length > 1 ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Teams
                </DropdownMenuLabel>
                {projetos.map(projeto => (
                  <DropdownMenuItem
                    key={projeto.nome}
                    onClick={() => {
                      alterarProjeto({ projetoId: projeto.id })
                    }}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Command className="size-4 shrink-0" />
                    </div>
                    {projeto.nome}
                    <DropdownMenuShortcut>⌘{projeto.id}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 p-2" 
                  onSelect={() => setAbrirModalAdicionarProjeto(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Adicionar Projeto</div>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem 
                className="gap-2 p-2"
                onSelect={() => setAbrirModalAdicionarProjeto(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Adicionar</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <ModalAdicionarProjeto
        open={abrirModalAdicionarProjeto}
        onOpenChange={setAbrirModalAdicionarProjeto}
        onSubmit={handleProjetoCriado}
      />
    </SidebarMenu>
  )
}
