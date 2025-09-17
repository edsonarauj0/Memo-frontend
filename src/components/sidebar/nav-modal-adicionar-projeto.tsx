import { useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const projetoFormSchema = z.object({
  name: z
    .string({ required_error: "O nome do projeto é obrigatório." })
    .trim()
    .min(3, "Informe ao menos 3 caracteres.")
    .max(80, "Use no máximo 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(160, "Use no máximo 160 caracteres.")
    .optional()
    .or(z.literal("")),
})

export type ProjetoFormValues = z.infer<typeof projetoFormSchema>

interface ModalAdicionarProjetoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (values: ProjetoFormValues) => Promise<void> | void
}

export function ModalAdicionarProjeto({ open, onOpenChange, onSubmit }: ModalAdicionarProjetoProps) {
  const form = useForm<ProjetoFormValues>({
    resolver: zodResolver(projetoFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const { control, handleSubmit: submit, reset, formState } = form

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset()
      }

      onOpenChange(nextOpen)
    },
    [onOpenChange, reset],
  )

  const handleSubmit = submit(async (values) => {
    await onSubmit?.(values)
    onOpenChange(false)
    reset()
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Form {...form}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Projeto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo projeto e clique em salvar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do projeto" autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Breve descrição" autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => reset()}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  )
}
