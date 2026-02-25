"use client";

import { formatAuditChange } from "@/lib/audit-format";
import type { AuditLogEntry } from "@/lib/audit-actions";

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "hace un momento";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays < 7) return `hace ${diffDays} días`;
  return d.toLocaleDateString(undefined, { dateStyle: "short" });
}

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    insert: "Inscrito",
    update: "Cambio",
    delete: "Baja",
    transfer: "Transferencia",
    transfer_out: "Cupo transferido",
    transfer_in: "Cupo recibido",
    reschedule: "Reagendado",
    reschedule_out: "Reagendado (salida)",
    reschedule_in: "Reagendado (entrada)",
  };
  return labels[action] ?? action;
}

function renderEntrySummary(entry: AuditLogEntry): string {
  if (entry.changes && entry.changes.length > 0) {
    return entry.changes.map(formatAuditChange).join("; ");
  }
  return formatActionLabel(entry.action);
}

export function AuditTimeline({
  entries,
  emptyMessage = "Sin historial.",
}: {
  entries: AuditLogEntry[];
  emptyMessage?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-col gap-0.5 rounded border border-border/60 bg-muted/30 px-3 py-2"
        >
          <span className="text-muted-foreground">
            {entry.actor_label}
            {entry.event_label ? ` · Evento: ${entry.event_label}` : ""} · {formatRelativeTime(entry.changed_at)}
          </span>
          <span className="font-medium">{renderEntrySummary(entry)}</span>
        </li>
      ))}
    </ul>
  );
}
