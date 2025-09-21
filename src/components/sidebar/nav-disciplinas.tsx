
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import type { Disciplina } from "@/types/auth"
import { BookOpen } from "lucide-react"

type NavDisciplinasProps = {
  disciplinas?: Disciplina[] | null
}

export function NavDisciplinas({ disciplinas }: NavDisciplinasProps) {
  const lista = (disciplinas ?? []).filter(
    (disciplina): disciplina is Disciplina => disciplina !== null && disciplina !== undefined,
  )

  if (lista.length === 0) {
    return null
  }

  return (
    <SidebarMenu>
      {lista.map(disciplina => (
        <SidebarMenuItem key={disciplina.id}>
          <SidebarMenuButton>
            <BookOpen />
            <span>{disciplina.nome}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
