"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  transferEnrollmentSpot,
  transferEnrollmentSpotToExistingEnrollment,
  searchParticipantsInEvent,
  type TransferSpotResult,
  type ParticipantInEventOption,
} from "./actions";
import type { EnrollmentRow } from "@/app/app/events/types";

function transferNewAction(
  _prev: TransferSpotResult | null,
  formData: FormData
): Promise<TransferSpotResult> {
  const fromEnrollmentId = String(formData.get("fromEnrollmentId") ?? "").trim();
  if (!fromEnrollmentId)
    return Promise.resolve({ success: false, error: "Falta la inscripción." });
  return transferEnrollmentSpot(
    fromEnrollmentId,
    {
      email: String(formData.get("email") ?? "").trim(),
      first_name: String(formData.get("first_name") ?? "").trim() || undefined,
      last_name: String(formData.get("last_name") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      angel_name: String(formData.get("angel_name") ?? "").trim() || undefined,
    },
    String(formData.get("notes") ?? "").trim() || undefined
  );
}

export function TransferSpotModal({
  enrollmentId,
  eventId,
  enrollments,
  open,
  onOpenChange,
}: {
  enrollmentId: string | null;
  eventId: string;
  enrollments: EnrollmentRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"choice" | "existing" | "new">("choice");
  const [people, setPeople] = useState<ParticipantInEventOption[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [state, formAction, isPending] = useActionState(transferNewAction, null);
  const [existingTransferState, setExistingTransferState] = useState<TransferSpotResult | null>(null);
  const [existingPending, setExistingPending] = useState(false);
  const didHandleSuccess = useRef(false);

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("choice");
      setSearchQuery("");
      setExistingTransferState(null);
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (!open) return;
    setStep("choice");
    setSearchQuery("");
    setExistingTransferState(null);
  }, [open]);

  useEffect(() => {
    if (state?.success && !didHandleSuccess.current) {
      didHandleSuccess.current = true;
      handleClose(false);
      router.refresh();
    }
    if (!state?.success) {
      didHandleSuccess.current = false;
    }
  }, [state, router]);

  useEffect(() => {
    if (existingTransferState?.success && !didHandleSuccess.current) {
      didHandleSuccess.current = true;
      handleClose(false);
      router.refresh();
    }
    if (!existingTransferState?.success) {
      didHandleSuccess.current = false;
    }
  }, [existingTransferState, router]);

  const debouncedSearch = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step !== "existing" || !eventId || !enrollmentId) return;

    const runSearch = () => {
      setPeopleLoading(true);
      searchParticipantsInEvent(eventId, searchQuery, enrollmentId)
        .then((data) => {
          setPeople(data);
        })
        .finally(() => {
          setPeopleLoading(false);
        });
    };

    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    debouncedSearch.current = setTimeout(runSearch, 300);

    return () => {
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
        debouncedSearch.current = null;
      }
    };
  }, [step, eventId, enrollmentId, searchQuery]);

  const filteredPeople = people;

  const handleSelectExisting = async (toEnrollmentId: string) => {
    if (!enrollmentId) return;
    setExistingPending(true);
    setExistingTransferState(null);
    const result = await transferEnrollmentSpotToExistingEnrollment(enrollmentId, toEnrollmentId);
    setExistingTransferState(result);
    setExistingPending(false);
  };

  const currentError = state?.success === false ? state.error : existingTransferState?.success === false ? existingTransferState.error : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir cupo</DialogTitle>
        </DialogHeader>

        {step === "choice" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              ¿A quién deseas transferir el cupo?
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-auto py-4"
              onClick={() => setStep("existing")}
            >
              Participante existente
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto py-4"
              onClick={() => setStep("new")}
            >
              Nuevo participante
            </Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "existing" && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("choice")}
            >
              ← Volver
            </Button>
            <div className="space-y-2">
              <Label>Buscar participante</Label>
              <Input
                placeholder="Nombre, apellido o correo…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {peopleLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : filteredPeople.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ningún participante coincide con tu búsqueda.
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto rounded-md border divide-y">
                {filteredPeople.map((p) => (
                  <li key={p.enrollmentId}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
                      onClick={() => handleSelectExisting(p.enrollmentId)}
                      disabled={existingPending}
                    >
                      <span className="font-medium">
                        {[p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}
                      </span>
                      <span className="text-muted-foreground ml-2">{p.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {currentError && (
              <p className="text-sm text-destructive">{currentError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "new" && (
          <form action={formAction} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("choice")}
            >
              ← Volver
            </Button>
            <input type="hidden" name="fromEnrollmentId" value={enrollmentId ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="transfer-email">Correo del destinatario (obligatorio)</Label>
              <Input
                id="transfer-email"
                name="email"
                type="email"
                required
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-first_name">Nombre (si es persona nueva)</Label>
              <Input id="transfer-first_name" name="first_name" placeholder="Nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-last_name">Apellido (si es persona nueva)</Label>
              <Input id="transfer-last_name" name="last_name" placeholder="Apellido" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-phone">Teléfono</Label>
              <Input id="transfer-phone" name="phone" placeholder="Teléfono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-angel_name">Ángel</Label>
              <Input id="transfer-angel_name" name="angel_name" placeholder="Ángel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-notes">Notas</Label>
              <Input id="transfer-notes" name="notes" placeholder="Notas opcionales" />
            </div>
            {currentError && (
              <p className="text-sm text-destructive">{currentError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Transferiendo…" : "Transferir cupo"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
