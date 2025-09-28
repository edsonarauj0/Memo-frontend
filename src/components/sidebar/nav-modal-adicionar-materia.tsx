import Color from "color";
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
import {
    ColorPicker,
    ColorPickerAlpha,
    ColorPickerFormat,
    ColorPickerHue,
    ColorPickerOutput,
    ColorPickerSelection,
} from "@/components/color-picker";

const DEFAULT_COLOR = "#000000";

const materiaFormSchema = z.object({
    nome: z.string().min(1, "O nome é obrigatório"),
    cor: z.string().optional(), // Adicionando o campo de cor
});

export type MateriaFormValues = z.infer<typeof materiaFormSchema>;

export function ModalAdicionarMateria({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { projetoId } = useParams<{ projetoId?: string }>();
    const navigate = useNavigate();
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // Estado para controlar a visibilidade do ColorPicker

    const form = useForm<MateriaFormValues>({
        resolver: zodResolver(materiaFormSchema),
        defaultValues: {
            nome: "",
            cor: DEFAULT_COLOR, // Valor padrão para a cor
        },
    });

    const { control, reset, formState } = form;

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                reset({ nome: "", cor: DEFAULT_COLOR });
                setIsColorPickerOpen(false);
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange, reset],
    );

    if (!projetoId) {
        console.error("projetoId não encontrado!");
        toast.error("Projeto não encontrado. Verifique a URL.");
        return null;
    }

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
                                render={({ field }) => {
                                    const currentColor = (field.value as string | undefined) ?? DEFAULT_COLOR;
                                    return (
                                        <FormItem>
                                            <FormLabel>Cor da matéria</FormLabel>
                                            <FormControl>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <Button
                                                            type="button"
                                                            className="h-10 w-10 p-0"
                                                            style={{ backgroundColor: currentColor }}
                                                            onClick={() => setIsColorPickerOpen((open) => !open)}
                                                            aria-label="Selecionar cor da matéria"
                                                        />
                                                        <span className="font-mono text-sm text-muted-foreground">
                                                            {currentColor}
                                                        </span>
                                                    </div>
                                                    {isColorPickerOpen && (
                                                        <div className="space-y-4 rounded-md border border-border p-4">
                                                            <ColorPicker
                                                                value={currentColor}
                                                                onChange={(nextColor) => {
                                                                    try {
                                                                        const color = Color(nextColor);
                                                                        const normalizedColor =
                                                                            color.alpha() < 1
                                                                                ? color.hexa()
                                                                                : color.hex();
                                                                        field.onChange(normalizedColor);
                                                                    } catch (error) {
                                                                        console.error(
                                                                            "Falha ao converter a cor para hexadecimal:",
                                                                            error,
                                                                        );
                                                                        field.onChange(nextColor);
                                                                    }
                                                                }}
                                                                className="gap-4"
                                                            >
                                                                <div className="relative h-48 w-full overflow-hidden rounded-md border border-border">
                                                                    <ColorPickerSelection className="h-full w-full" />
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <ColorPickerHue className="h-4 w-full" />
                                                                    <ColorPickerAlpha className="h-4 w-full" />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <ColorPickerOutput className="w-24" />
                                                                    <ColorPickerFormat className="flex-1" />
                                                                </div>
                                                            </ColorPicker>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
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