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
  addAppUser,
  removeAppUser,
  type AppUserRow,
} from "./actions";

function addUserAction(
  _prev: { success: true } | { success: false; error: string } | null,
  formData: FormData
) {
  return addAppUser(formData);
}

export function UsuariosTable({ rows }: { rows: AppUserRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addUserAction, null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const handleRemove = async (id: string) => {
    if (!confirm("¿Quitar a este usuario de la lista? Ya no podrá acceder a la app.")) return;
    setRemovingId(id);
    const result = await removeAppUser(id);
    setRemovingId(null);
    if (result.success) router.refresh();
    else alert(result.error);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Usuarios</h3>
          <Button onClick={() => setOpen(true)}>Añadir usuario</Button>
        </div>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Correo</th>
                <th className="min-w-[8rem] px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                    No hay usuarios. Añade correos que podrán acceder a la app.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={removingId === row.id}
                        onClick={() => handleRemove(row.id)}
                      >
                        Quitar
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
            <DialogTitle>Añadir usuario</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Correo</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                required
                placeholder="usuario@ejemplo.com"
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
