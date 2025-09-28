import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { adicionarMateria } from "@/api/projeto";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useState } from "react";
import { ColorPicker } from "@/components/color-picker"; // Importando o ColorPicker

const materiaFormSchema = z.object({
    nome: z.string().min(1, "O nome é obrigatório"),
    cor: z.string().optional(), // Adicionando o campo de cor
});

export type MateriaFormValues = z.infer<typeof materiaFormSchema>;

export function ModalAdicionarMateria({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { projetoId } = useParams<{ projetoId?: string }>();
    const navigate = useNavigate();
    const [selectedColor, setSelectedColor] = useState<string>("rgba(0,0,0,1)"); // Valor inicial válido
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // Estado para controlar a visibilidade do ColorPicker

    if (!projetoId) {
        console.error("projetoId não encontrado!");
        toast.error("Projeto não encontrado. Verifique a URL.");
        return null;
    }

    const form = useForm<MateriaFormValues>({
        resolver: zodResolver(materiaFormSchema),
        defaultValues: {
            nome: "",
            cor: selectedColor, // Valor padrão para a cor
        },
    });

    const { control, handleSubmit: submit, reset, formState } = form;

    const handleSubmit = form.handleSubmit(async (values) => {
        try {
            await adicionarMateria(Number(projetoId), {
                nome: values.nome,
                cor: values.cor, // Incluindo a cor no envio
            });

            const currentPath = window.location.pathname;
            const materiasPath = `/projeto/${projetoId}/materias`;

            if (currentPath !== materiasPath) {
                navigate(materiasPath);
            }
            toast.success("Matéria criada com sucesso!");
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível criar a matéria.";
            console.error("Erro ao criar matéria:", message); // Log para depuração
            toast.error(message);
        }
    });

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                reset();
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange, reset],
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Matéria</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes da nova matéria e clique em salvar.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4">
                            <FormField
                                control={control}
                                name="nome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da matéria</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome da matéria" autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="cor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cor da matéria</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                {/* Botão para abrir o ColorPicker */}
                                                <Button
                                                    type="button"
                                                    className="w-10 h-10 p-0 border"
                                                    style={{ backgroundColor: selectedColor }}
                                                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                                />
                                                <span>{selectedColor}</span>
                                            </div>
                                            {/* ColorPicker */}
                                            {isColorPickerOpen && (
                                                <div className="mt-4">
                                                    <ColorPicker
                                                        value={selectedColor}
                                                        onChange={(color) => {
                                                            const formattedColor = `rgba(${color.join(",")})`; // Formatando a cor corretamente
                                                            setSelectedColor(formattedColor);
                                                            field.onChange(formattedColor); // Atualizando o valor do campo
                                                        }}
                                                    />
                                                </div>
                                            )}
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
    );
}