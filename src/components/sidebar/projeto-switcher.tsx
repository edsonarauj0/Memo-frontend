import * as React from "react"
import { ChevronsUpDown, Command, Plus } from "lucide-react"

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

type ProjetoSwitcherItem = {
  id: number
  nome: string
  descricao: string
  cargo: string | null
  editais: string | null
  imagemUrl: string | null
}

export function ProjetoSwitcher({ projetos }: { projetos: ProjetoSwitcherItem[] }) {
  const { isMobile } = useSidebar();
  const [abrirModalAdicionarProjeto, setAbrirModalAdicionarProjeto] = React.useState<boolean>(false);

  const [projetoAtivo, setProjetoAtivo] = React.useState<ProjetoSwitcherItem | null>(
    () => projetos[0] ?? null,
  )

  React.useEffect(() => {
    if (projetos.length === 0) {
      setProjetoAtivo(null)
      return
    }

    setProjetoAtivo(current => {
      if (!current) {
        return projetos[0]
      }

      const nextProjeto = projetos.find(projeto => projeto.id === current.id)
      return nextProjeto ?? projetos[0]
    })
  }, [projetos])

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
                    onClick={() => setProjetoAtivo(projeto)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Command className="size-4 shrink-0" />
                    </div>
                    {projeto.descricao}
                    <DropdownMenuShortcut>⌘{projeto.id}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 p-2" 
                  onSelect={() => setAbrirModalAdicionarProjeto(true)}  // Adicione isso para abrir o modal
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
                onSelect={() => setAbrirModalAdicionarProjeto(true)}  // Mova para onSelect aqui
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
      />
    </SidebarMenu>
  )
}
