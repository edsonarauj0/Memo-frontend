import { useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

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
import { createProjeto, type CreateProjetoResponse } from "@/api/projeto"

const projetoFormSchema = z.object({
  nome: z
    .string().min(1, "O nome do projeto é obrigatório." )
    .trim()
    .min(3, "Informe ao menos 3 caracteres.")
    .max(80, "Use no máximo 80 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(160, "Use no máximo 160 caracteres.")
    .optional()
    .or(z.literal("")),
  organizacao: z
    .string()
    .trim()
    .min(3, "Informe ao menos 3 caracteres.")
    .max(80, "Use no máximo 80 caracteres.")
    .optional()
    .or(z.literal("")),
  cargo: z
    .string()
    .trim()
    .min(3, "Informe ao menos 3 caracteres.")
    .max(80, "Use no máximo 80 caracteres.")
    .optional()
    .or(z.literal("")),
})

export type ProjetoFormValues = z.infer<typeof projetoFormSchema>

interface ModalAdicionarProjetoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (projeto: CreateProjetoResponse) => Promise<void> | void
}

export function ModalAdicionarProjeto({ open, onOpenChange, onSubmit }: ModalAdicionarProjetoProps) {
  const form = useForm<ProjetoFormValues>({
    resolver: zodResolver(projetoFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      organizacao: "",
      cargo: "",
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

  const handleSubmit = submit(async values => {
    try {
      const descricao = values.descricao?.length ? values.descricao : null

      const projetoCriado = await createProjeto({
        nome: values.nome,
        descricao,
        organizacao: values.organizacao ?? "",
        cargo: values?.cargo?.length ? values.cargo : "",
      })

      toast.success("Projeto criado com sucesso!")

      await onSubmit?.(projetoCriado)
      onOpenChange(false)
      reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar o projeto."
      toast.error(message)
    }
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
                name="nome"
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
                name="descricao"
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
              <FormField
                control={control}
                name="organizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizadora</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
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
