"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProgramType,
  deleteProgramType,
  type ProgramTypeRow,
} from "./actions";

function addProgramTypeAction(
  _prev: { success: true } | { success: false; error: string } | null,
  formData: FormData
) {
  return addProgramType(formData);
}

export function ProgramTypesTable({ rows }: { rows: ProgramTypeRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addProgramTypeAction, null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este tipo de entrenamiento? Solo se puede si no hay eventos que lo usen.")) return;
    setDeletingId(id);
    const result = await deleteProgramType(id);
    setDeletingId(null);
    if (result.success) router.refresh();
    else alert(result.error);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Entrenamientos</h3>
          <Button onClick={() => setOpen(true)}>Añadir entrenamiento</Button>
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Etiqueta</th>
                <th className="min-w-[8rem] px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No hay tipos de entrenamiento. Añade los que usarás en los eventos.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{row.code}</td>
                    <td className="px-4 py-3">{row.label}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir entrenamiento</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pt-code">Código</Label>
              <Input
                id="pt-code"
                name="code"
                required
                placeholder="PT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-label">Etiqueta</Label>
              <Input
                id="pt-label"
                name="label"
                required
                placeholder="Poder Total"
              />
            </div>
            {state && !state.success && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Añadiendo…" : "Añadir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
