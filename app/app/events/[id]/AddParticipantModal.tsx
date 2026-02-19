"use client";

import { useActionState, useEffect, useRef } from "react";
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
  addParticipant,
  type AddParticipantResult,
} from "./actions";

function addParticipantAction(
  _prev: AddParticipantResult | null,
  formData: FormData
): Promise<AddParticipantResult> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return Promise.resolve({ success: false, error: "Falta el evento." });
  return addParticipant(eventId, {
    first_name: String(formData.get("first_name") ?? "").trim() || undefined,
    last_name: String(formData.get("last_name") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim(),
    angel_name: String(formData.get("angel_name") ?? "").trim() || undefined,
  });
}

export function AddParticipantModal({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    addParticipantAction,
    null
  );
  const didHandleSuccess = useRef(false);

  useEffect(() => {
    if (state?.success && !didHandleSuccess.current) {
      didHandleSuccess.current = true;
      onOpenChange(false);
      router.refresh();
    }
    if (!state?.success) {
      didHandleSuccess.current = false;
    }
  }, [state, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar participante</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="eventId" value={eventId} />
          <div className="space-y-2">
            <Label htmlFor="add-first_name">Nombre</Label>
            <Input id="add-first_name" name="first_name" placeholder="Nombre" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-last_name">Apellido</Label>
            <Input id="add-last_name" name="last_name" placeholder="Apellido" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-phone">Teléfono</Label>
            <Input id="add-phone" name="phone" placeholder="Teléfono" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-email">Correo (obligatorio)</Label>
            <Input
              id="add-email"
              name="email"
              type="email"
              required
              placeholder="Correo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-angel_name">Ángel</Label>
            <Input id="add-angel_name" name="angel_name" placeholder="Ángel" />
          </div>
          {state && !state.success && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Agregando…" : "Agregar participante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
