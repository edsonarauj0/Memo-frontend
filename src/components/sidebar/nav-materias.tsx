
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, useSidebar, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar"
import type { Materia } from "@/types/auth"
import { BookAlert, Folder, Forward, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useNavigate } from "react-router-dom"

type NavDisciplinasProps = {
  materias?: Materia[] | null
}

export function NavMaterias({ materias }: NavDisciplinasProps) {

  const navigate = useNavigate();
  const { isMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <span>
          <BookAlert />
          <span>Materia</span>
        </span>
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
          <DropdownMenuItem onClick={() => navigate(`materias`)}>
            <Folder className="text-muted-foreground" />
            <span>Ver Materias</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Forward className="text-muted-foreground" />
            <span>Share Project</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Trash2 className="text-muted-foreground" />
            <span>Deletar Materia</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
