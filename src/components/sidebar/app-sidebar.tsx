import * as React from "react"

import { sidebarData } from "../../config/navigation"
import { useAuth } from "../../hooks/useAuth"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projetos"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../ui/sidebar"
import { ProjetoSwitcher } from "./projeto-switcher"
import { Separator } from "../ui/separator"
import { Home } from "lucide-react"
import { NavMaterias } from "./nav-materias"
import type { Materia } from "@/types/auth"
import type { ProjetoDetalhado } from "@/api/projeto"

type MenuProps = React.ComponentProps<typeof Sidebar> & {
  header?: React.ReactNode
  toolbar?: React.ReactNode
  materias?: Materia[] | null
  projetoSelecionado?: ProjetoDetalhado | null
}

export function Menu({ children, header, toolbar, materias, projetoSelecionado, ...props }: MenuProps) {
  const { user } = useAuth();
  const sidebarMaterias = projetoSelecionado?.materias ?? materias ?? user?.materias ?? null;
  const projetoId = projetoSelecionado?.id ?? user?.projetoSelecionadoId ?? null;
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ProjetoSwitcher
            projetos={
              user?.projetos?.map(projeto => ({
                id: projeto.id,
                nome: projeto.nome ?? "",
                plan: projeto.cargo ?? "",
                logo: projeto.imagemUrl,
                descricao: projeto.descricao ?? "",
                editais: projeto.editais,
              })) || []
            }
            projetoSelecionadoId={user?.projetoSelecionadoId ?? undefined}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
              <NavMaterias materias={sidebarMaterias} projetoId={projetoId} />
          <NavMain items={sidebarData.navMain} />
          <NavProjects projects={sidebarData.projects} />
        </SidebarContent>
        <SidebarFooter>
          {user && <NavUser user={user} />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-6" />
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {header}
              </div>
              {toolbar ? <div className="flex shrink-0 items-center gap-2">{toolbar}</div> : null}
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}