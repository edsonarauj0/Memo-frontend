import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, useSidebar } from "@/components/ui/sidebar"
import { DEFAULT_PROJETO_ID } from "@/config/constants"
import { BookAlert, Folder, Forward, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useNavigate, useParams } from "react-router-dom"

export function NavMaterias() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { isMobile } = useSidebar()

  const handleVerMaterias = () => {
    const projetoId = id ?? String(DEFAULT_PROJETO_ID)
    navigate(`/projeto/${projetoId}/materias`)
  }

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
          <DropdownMenuItem onClick={handleVerMaterias}>
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
