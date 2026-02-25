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
import { createEvent, type CreateEventResult } from "./actions";
import { cn } from "@/lib/utils";
import type { CityRow, ProgramTypeRow } from "@/app/app/administration/actions";

function createEventAction(_prev: CreateEventResult | null, formData: FormData): Promise<CreateEventResult> {
  return createEvent(formData);
}

export function NewEventModal({
  open,
  onOpenChange,
  cities,
  programTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: CityRow[];
  programTypes: ProgramTypeRow[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createEventAction, null);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const defaultProgram = programTypes[0]?.code ?? "PT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo entrenamiento</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program_type">Programa</Label>
            <select
              id="program_type"
              name="program_type"
              defaultValue={defaultProgram}
              className={cn(
                "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              )}
            >
              {programTypes.map((pt) => (
                <option key={pt.id} value={pt.code}>
                  {pt.code} — {pt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Número</Label>
            <Input id="code" name="code" required placeholder="44D" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <select
              id="city"
              name="city"
              required
              className={cn(
                "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              )}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coordinator">Coordinador</Label>
            <Input id="coordinator" name="coordinator" placeholder="Coordinador" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Inicio</Label>
            <Input id="start_date" name="start_date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Fin</Label>
            <Input id="end_date" name="end_date" type="date" />
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
              {isPending ? "Creando…" : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewEventButton({
  cities,
  programTypes,
}: {
  cities: CityRow[];
  programTypes: ProgramTypeRow[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Nuevo entrenamiento</Button>
      <NewEventModal open={open} onOpenChange={setOpen} cities={cities} programTypes={programTypes} />
    </>
  );
}
