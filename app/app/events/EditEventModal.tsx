"use client";

import { useActionState, useEffect } from "react";
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
import { updateEvent, type UpdateEventResult } from "./actions";
import type { EventRow } from "./types";
import { cn } from "@/lib/utils";

function editEventAction(
  _prev: UpdateEventResult | null,
  formData: FormData
): Promise<UpdateEventResult> {
  const eventId = formData.get("eventId") as string;
  if (!eventId) return Promise.resolve({ success: false, error: "Falta el evento." });
  return updateEvent(eventId, formData);
}

function toLocalDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return "";
  }
}

export function EditEventModal({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventRow | null;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(editEventAction, null);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="eventId" value={event.id} />
          <div className="space-y-2">
            <Label htmlFor="edit_program_type">Programa</Label>
            <select
              id="edit_program_type"
              name="program_type"
              defaultValue={event.program_type}
              className={cn(
                "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              )}
            >
              <option value="PT">PT — Poder Total</option>
              <option value="LT">LT — Libertad Total</option>
              <option value="TL">TL — TL</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_code">Número</Label>
            <Input
              id="edit_code"
              name="code"
              required
              defaultValue={event.code}
              placeholder="42"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_city">Ciudad</Label>
            <select
              id="edit_city"
              name="city"
              required
              defaultValue={event.city}
              className={cn(
                "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              )}
            >
              <option value="Miami">Miami</option>
              <option value="Atlanta">Atlanta</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_coordinator">Coordinador</Label>
            <Input
              id="edit_coordinator"
              name="coordinator"
              defaultValue={event.coordinator ?? ""}
              placeholder="Coordinador"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_start_date">Inicio</Label>
            <Input
              id="edit_start_date"
              name="start_date"
              type="date"
              defaultValue={toLocalDate(event.start_date)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_end_date">Fin</Label>
            <Input
              id="edit_end_date"
              name="end_date"
              type="date"
              defaultValue={toLocalDate(event.end_date)}
            />
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
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
