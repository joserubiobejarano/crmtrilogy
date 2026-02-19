"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuditLogRow } from "./audit";

export type AuditLogEntry = AuditLogRow & {
  actor_label: string;
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
  return rows.map((row) => ({
    ...row,
    actor_label: row.changed_by ? "Usuario" : "Sistema",
  }));
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
  }));
}
