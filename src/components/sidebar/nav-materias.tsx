
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, useSidebar } from "@/components/ui/sidebar"
import type { Materia } from "@/types/auth"
import { Book, Folder, Forward, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"

type NavDisciplinasProps = {
  materias?: Materia[] | null
}

export function NavMaterias({ materias }: NavDisciplinasProps) {
  debugger
  const lista = (materias ?? []).filter(
    (materia): materia is Materia => materia !== null && materia !== undefined,
  )
  const { isMobile } = useSidebar()
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Materias</SidebarGroupLabel>
      <SidebarMenu>
          <SidebarMenuItem >
            <SidebarMenuButton asChild>
              <a href={"#"}>
                <Book />
                <span>Materia</span>
              </a>
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
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>Ver materias</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Pesquisar materia</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Deletar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
