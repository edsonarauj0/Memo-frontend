import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ModalAdicionarProjetoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalAdicionarProjeto({ open, onOpenChange }: ModalAdicionarProjetoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Projeto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo projeto e clique em salvar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Nome do Projeto</Label>
              <Input id="name-1" name="name" placeholder="Nome do projeto" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="descricao-1">Descrição</Label>
              <Input id="descricao-1" name="descricao" placeholder="Breve descrição" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
