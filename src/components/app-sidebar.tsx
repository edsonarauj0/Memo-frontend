import * as React from "react"

import { sidebarData } from "../config/navigation"
import { useAuth } from "../hooks/useAuth"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "./ui/sidebar"
import { ProjetoSwitcher } from "./projeto-switcher"

export function Menu({ children, ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  debugger
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ProjetoSwitcher projetos={user?.projetos?.map(projeto => ({
            id: projeto.id,
            name: projeto.nome ?? "",
            plan: projeto.cargo ?? "",
            logo: projeto.imagemUrl, // Replace with your actual logo component or logic
            descricao: projeto.descricao ?? "",
            editais: projeto.editais,
          })) || []} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={sidebarData.navMain} />
          <NavProjects projects={sidebarData.projects} />
        </SidebarContent>
        <SidebarFooter>
          {user && <NavUser user={user} />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
