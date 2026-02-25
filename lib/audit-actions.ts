"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuditLogRow } from "./audit";

export type AuditLogEntry = AuditLogRow & {
  actor_label: string;
  event_label: string | null;
};

export async function getAuditLogAll(limit = 100): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, entity_type, entity_id, action, changed_by, changed_at, context, changes")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const rows = (data ?? []) as AuditLogRow[];
  const eventIds = [
    ...new Set(
      rows
        .map((r) => r.context?.event_id as string | undefined)
        .filter((id): id is string => typeof id === "string")
    ),
  ];
  let eventLabels: Record<string, string> = {};
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, code, city, start_date")
      .in("id", eventIds);
    if (events) {
      eventLabels = Object.fromEntries(
        events.map((e: { id: string; code: string | null; city: string | null; start_date: string | null }) => [
          e.id,
          [e.code, e.city, e.start_date].filter(Boolean).join(" · ") || e.id,
        ])
      );
    }
  }
  return rows.map((row) => {
    const ctx = row.context ?? {};
    const actorEmail = ctx.actor_email as string | null | undefined;
    const eventId = ctx.event_id as string | undefined;
    return {
      ...row,
      actor_label: typeof actorEmail === "string" && actorEmail ? actorEmail : row.changed_by ? "Usuario" : "Sistema",
      event_label: eventId ? eventLabels[eventId] ?? null : null,
    };
  });
}

export async function getAuditLogForEvent(
  eventId: string,
  limit = 50
): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, entity_type, entity_id, action, changed_by, changed_at, context, changes")
    .contains("context", { event_id: eventId })
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const rows = (data ?? []) as AuditLogRow[];
  return rows.map((row) => ({
    ...row,
    actor_label: row.changed_by ? "Usuario" : "Sistema",
    event_label: null,
  }));
}

export async function getAuditLogForEntity(
  entityType: string,
  entityId: string,
  limit = 30
): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, entity_type, entity_id, action, changed_by, changed_at, context, changes")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const rows = (data ?? []) as AuditLogRow[];
  return rows.map((row) => ({
    ...row,
    actor_label: row.changed_by ? "Usuario" : "Sistema",
    event_label: null,
  }));
}

export async function getAuditLogForPerson(
  personId: string,
  limit = 50
): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const [personResult, contextResult] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, entity_type, entity_id, action, changed_by, changed_at, context, changes")
      .eq("entity_type", "person")
      .eq("entity_id", personId)
      .order("changed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("audit_log")
      .select("id, entity_type, entity_id, action, changed_by, changed_at, context, changes")
      .contains("context", { person_id: personId })
      .order("changed_at", { ascending: false })
      .limit(limit),
  ]);

  const personRows = (personResult.data ?? []) as AuditLogRow[];
  const contextRows = (contextResult.data ?? []) as AuditLogRow[];
  const seen = new Set<string>();
  const merged: AuditLogRow[] = [];
  for (const row of [...personRows, ...contextRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  merged.sort(
    (a, b) =>
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );
  return merged.slice(0, limit).map((row) => ({
    ...row,
    actor_label: row.changed_by ? "Usuario" : "Sistema",
    event_label: null,
  }));
}
