
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home } from "lucide-react"

type NavDisciplinasProps = {
  disciplinas: Disciplina[]
}

export function NavDisciplinas({ disciplinas }: NavDisciplinasProps) {
  return (
    <SidebarMenu>
      {disciplinas.map((disciplina) => (
        <SidebarMenuItem key={disciplina.id}>
          <SidebarMenuButton>
            <Home />
            <span>{disciplina.nome}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
