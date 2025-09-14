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
} from "./ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar"

export function ProjetoSwitcher({
  projetos,
}: {
  projetos: Array<{
    id: number;
    nome: string;
    descricao: string;
    cargo: string | null;
    editais: string | null;
    imagemUrl: string | null;
  }>;
}) {
  const { isMobile } = useSidebar()
  const [projetoAtivo, setProjetoAtivo] = React.useState(projetos[0])
debugger
  if (!projetoAtivo) {
    return null
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
                {projetos.map((projeto, index) => (
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
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add team</div>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add team</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
