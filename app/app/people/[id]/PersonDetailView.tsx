"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateEnrollmentField } from "@/app/app/events/[id]/actions";
import type {
  EnrollmentWithEventAndPayments,
  PersonWithEnrollments,
} from "@/app/app/people/types";
import type { AuditLogEntry } from "@/lib/audit-actions";
import { AuditTimeline } from "@/components/audit-timeline";
import { moveToNextProgram } from "./actions";
import { cn } from "@/lib/utils";

const PROGRAM_ORDER = ["PT", "LT", "TL"] as const;

function formatDateRange(start: string, end: string) {
  try {
    const s = new Date(start).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
    const e = new Date(end).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function formatPaymentDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "short",
    });
  } catch {
    return iso;
  }
}

type BooleanField =
  | "attended"
  | "details_sent"
  | "confirmed"
  | "contract_signed"
  | "cca_signed"
  | "health_doc_signed"
  | "tl_norms_signed"
  | "tl_rules_signed";

function nextProgramType(current: string): string | null {
  const upper = current?.toUpperCase();
  if (upper === "PT") return "LT";
  if (upper === "LT") return "TL";
  return null;
}

function EditableCell({
  value,
  onBlur,
  placeholder,
}: {
  value: string;
  onBlur: (value: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setLocal(value);
  }, [value, editing]);

  const handleBlur = () => {
    setEditing(false);
    if (local !== value) onBlur(local);
  };

  if (editing) {
    return (
      <Input
        className="h-8 text-sm"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && handleBlur()}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "block w-full rounded border border-transparent px-2 py-1.5 text-left text-sm hover:border-input hover:bg-muted/50",
        !value && "text-muted-foreground"
      )}
      onClick={() => setEditing(true)}
    >
      {value || (placeholder ?? "")}
    </button>
  );
}

export function PersonDetailView({
  data,
  auditEntries = [],
}: {
  data: PersonWithEnrollments;
  auditEntries?: AuditLogEntry[];
}) {
  const router = useRouter();
  const [moveError, setMoveError] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleToggle = useCallback(
    async (enrollmentId: string, field: BooleanField, checked: boolean) => {
      const result = await updateEnrollmentField(enrollmentId, field, checked);
      if (result.success) router.refresh();
    },
    [router]
  );

  const handleBlurField = useCallback(
    async (
      enrollmentId: string,
      field: "admin_notes" | "angel_name",
      value: string
    ) => {
      const result = await updateEnrollmentField(enrollmentId, field, value);
      if (result.success) router.refresh();
    },
    [router]
  );

  const handleMoveToNext = useCallback(
    async (enrollmentId: string) => {
      setMoveError(null);
      setMovingId(enrollmentId);
      const result = await moveToNextProgram(enrollmentId, data.id);
      setMovingId(null);
      if (result.success) {
        router.refresh();
      } else {
        setMoveError(result.error);
      }
    },
    [data.id, router]
  );

  const enrollmentsByProgram = PROGRAM_ORDER.map((programType) => ({
    programType,
    enrollments: data.enrollments.filter(
      (e) => e.event?.program_type?.toUpperCase() === programType
    ),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/people">← Volver</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Nombre</Label>
              <p className="text-sm">{data.first_name ?? "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Apellido</Label>
              <p className="text-sm">{data.last_name ?? "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Correo</Label>
              <p className="text-sm">{data.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Teléfono</Label>
              <p className="text-sm">{data.phone ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {moveError && (
        <p className="text-sm text-destructive">{moveError}</p>
      )}

      {enrollmentsByProgram.map(
        ({ programType, enrollments }) =>
          enrollments.length > 0 && (
            <div key={programType} className="space-y-3">
              <h3 className="text-lg font-semibold">{programType}</h3>
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <EnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    onToggle={handleToggle}
                    onBlurField={handleBlurField}
                    onMoveToNext={handleMoveToNext}
                    isMoving={movingId === enrollment.id}
                  />
                ))}
              </div>
            </div>
          )
      )}

      {data.enrollments.length === 0 && (
        <p className="text-muted-foreground">Aún no hay inscripciones.</p>
      )}

      {(auditEntries.length > 0 || data.enrollments.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Historial</h3>
          <AuditTimeline entries={auditEntries} emptyMessage="Sin cambios recientes." />
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  onToggle,
  onBlurField,
  onMoveToNext,
  isMoving,
}: {
  enrollment: EnrollmentWithEventAndPayments;
  onToggle: (id: string, field: BooleanField, checked: boolean) => void;
  onBlurField: (
    id: string,
    field: "admin_notes" | "angel_name",
    value: string
  ) => void;
  onMoveToNext: (id: string) => void;
  isMoving: boolean;
}) {
  const event = enrollment.event;
  const programType = event?.program_type?.toUpperCase() ?? "";
  const showCCA = programType === "LT" || programType === "TL";
  const showDocSalud = programType === "PT";
  const showNormasReglasTL = programType === "TL";
  const isActive = event?.active === true;
  const nextType = nextProgramType(event?.program_type ?? "");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">
            {event?.code ?? "—"} · {event?.city ?? "—"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {event?.start_date && event?.end_date
              ? formatDateRange(event.start_date, event.end_date)
              : "—"}
          </p>
        </div>
        {isActive && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Activo
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <Switch
              id={`${enrollment.id}-attended`}
              checked={enrollment.attended}
              onCheckedChange={(c) =>
                onToggle(enrollment.id, "attended", c)
              }
            />
            <Label htmlFor={`${enrollment.id}-attended`}>Asistió</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`${enrollment.id}-details_sent`}
              checked={enrollment.details_sent}
              onCheckedChange={(c) =>
                onToggle(enrollment.id, "details_sent", c)
              }
            />
            <Label htmlFor={`${enrollment.id}-details_sent`}>
              Envío detalles
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`${enrollment.id}-confirmed`}
              checked={enrollment.confirmed}
              onCheckedChange={(c) =>
                onToggle(enrollment.id, "confirmed", c)
              }
            />
            <Label htmlFor={`${enrollment.id}-confirmed`}>Confirmó</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`${enrollment.id}-contract_signed`}
              checked={enrollment.contract_signed}
              onCheckedChange={(c) =>
                onToggle(enrollment.id, "contract_signed", c)
              }
            />
            <Label htmlFor={`${enrollment.id}-contract_signed`}>
              Contrato
            </Label>
          </div>
          {showCCA && (
            <div className="flex items-center gap-2">
              <Switch
                id={`${enrollment.id}-cca_signed`}
                checked={enrollment.cca_signed}
                onCheckedChange={(c) =>
                  onToggle(enrollment.id, "cca_signed", c)
                }
              />
              <Label htmlFor={`${enrollment.id}-cca_signed`}>CCA</Label>
            </div>
          )}
          {showDocSalud && (
            <div className="flex items-center gap-2">
              <Switch
                id={`${enrollment.id}-health_doc_signed`}
                checked={enrollment.health_doc_signed ?? false}
                onCheckedChange={(c) =>
                  onToggle(enrollment.id, "health_doc_signed", c)
                }
              />
              <Label htmlFor={`${enrollment.id}-health_doc_signed`}>
                Doc. Salud
              </Label>
            </div>
          )}
          {showNormasReglasTL && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id={`${enrollment.id}-tl_norms_signed`}
                  checked={enrollment.tl_norms_signed ?? false}
                  onCheckedChange={(c) =>
                    onToggle(enrollment.id, "tl_norms_signed", c)
                  }
                />
                <Label htmlFor={`${enrollment.id}-tl_norms_signed`}>
                  Normas TL
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`${enrollment.id}-tl_rules_signed`}
                  checked={enrollment.tl_rules_signed ?? false}
                  onCheckedChange={(c) =>
                    onToggle(enrollment.id, "tl_rules_signed", c)
                  }
                />
                <Label htmlFor={`${enrollment.id}-tl_rules_signed`}>
                  Reglas TL
                </Label>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Observaciones</Label>
          <EditableCell
            value={enrollment.admin_notes ?? ""}
            onBlur={(v) => onBlurField(enrollment.id, "admin_notes", v)}
            placeholder="Notas"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Ángel</Label>
          <EditableCell
            value={enrollment.angel_name ?? ""}
            onBlur={(v) => onBlurField(enrollment.id, "angel_name", v)}
            placeholder="Ángel"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Pagos</Label>
          {enrollment.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {enrollment.payments.map((p) => (
                <li key={p.id}>
                  {p.method ?? "—"} {p.fee_amount != null ? String(p.fee_amount) : ""}{" "}
                  ({formatPaymentDate(p.created_at)})
                </li>
              ))}
            </ul>
          )}
        </div>

        {isActive && nextType && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMoveToNext(enrollment.id)}
            disabled={isMoving}
          >
            {isMoving ? "Moviendo…" : "Mover al siguiente programa"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
