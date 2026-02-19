"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { programTypeToDisplay } from "@/lib/program-display";
import type { PersonRow } from "./types";

export type DeletePersonResult = { success: true } | { success: false; error: string };

export async function deletePerson(personId: string): Promise<DeletePersonResult> {
  if (!personId?.trim()) {
    return { success: false, error: "ID de participante no válido." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("people").delete().eq("id", personId.trim());
  if (error) {
    return { success: false, error: error.message || "No se pudo eliminar al participante." };
  }
  revalidatePath("/app/people");
  return { success: true };
}

const BACKLOG_STATUSES = [
  "paid",
  "confirmed",
  "no_show_paid",
  "no_show_unpaid",
  "rescheduled",
  "transferred_out",
] as const;

export type PeopleFilters = {
  city?: string;
  paymentMethod?: string;
  backlog?: boolean;
  programType?: string;
  eventCode?: string;
};

export type EventFilterOptions = {
  programTypes: { value: string; label: string }[];
  codes: string[];
};

export async function getEventFilterOptions(): Promise<EventFilterOptions> {
  const supabase = await createClient();
  const { data: events = [] } = await supabase
    .from("events")
    .select("program_type, code")
    .is("scheduled_deletion_at", null);

  type EventRow = { program_type: string; code: string };
  const rows = events as EventRow[];
  const programTypeSet = new Set<string>();
  const codeSet = new Set<string>();
  for (const e of rows) {
    if (e.program_type) programTypeSet.add(e.program_type.trim().toUpperCase());
    if (e.code) codeSet.add(String(e.code).trim());
  }
  const programTypes = Array.from(programTypeSet)
    .sort()
    .map((value) => ({ value, label: programTypeToDisplay(value) }));
  const codes = Array.from(codeSet).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
  return { programTypes, codes };
}

export type PeopleCounts = {
  total: number;
  byCity: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  backlogTotal: number;
};

type EnrollRow = {
  id: string;
  person_id: string;
  city: string | null;
  status: string;
  attended: boolean;
};

type EnrollRowWithEvent = EnrollRow & {
  event?: { program_type: string; code: string; scheduled_deletion_at: string | null } | null;
};

export async function getFilteredPeople(
  filters: PeopleFilters
): Promise<{ people: PersonRow[]; counts: PeopleCounts }> {
  const supabase = await createClient();

  const hasEventFilter = Boolean(
    (filters.programType && filters.programType.trim()) ||
    (filters.eventCode && filters.eventCode.trim())
  );
  const hasFilters =
    (filters.city && filters.city !== "all") ||
    (filters.paymentMethod && filters.paymentMethod !== "all") ||
    filters.backlog === true ||
    hasEventFilter;

  if (!hasFilters) {
    const { data: rows = [] } = await supabase
      .from("people")
      .select("id, first_name, last_name, email, phone, city, created_at")
      .order("created_at", { ascending: false });

    const people = rows as PersonRow[];
    const counts = await getPeopleCounts(supabase);
    return { people, counts };
  }

  let enrollmentRows: EnrollRowWithEvent[];
  if (hasEventFilter) {
    const { data: rows = [] } = await supabase
      .from("enrollments")
      .select("id, person_id, city, status, attended, event:events(program_type, code, scheduled_deletion_at)");
    enrollmentRows = rows as EnrollRowWithEvent[];
    enrollmentRows = enrollmentRows.filter((e) => {
      const ev = e.event;
      if (!ev || ev.scheduled_deletion_at) return false;
      if (filters.programType && filters.programType.trim() && ev.program_type !== filters.programType.trim())
        return false;
      if (filters.eventCode && filters.eventCode.trim() && ev.code !== filters.eventCode.trim())
        return false;
      return true;
    });
  } else {
    const { data: rows = [] } = await supabase
      .from("enrollments")
      .select("id, person_id, city, status, attended");
    enrollmentRows = rows as EnrollRowWithEvent[];
  }

  const enrollmentIds = enrollmentRows.map((r) => r.id);
  let enrollmentIdsWithPayment = new Set<string>();
  const paymentMethodByEnrollmentId: Record<string, string> = {};

  if (enrollmentIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("enrollment_id, method")
      .in("enrollment_id", enrollmentIds);

    if (payments) {
      for (const p of payments as { enrollment_id: string; method: string | null }[]) {
        enrollmentIdsWithPayment.add(p.enrollment_id);
        if (p.method) paymentMethodByEnrollmentId[p.enrollment_id] = p.method;
      }
    }
  }

  let matchingPersonIds = new Set<string>();
  for (const e of enrollmentRows) {
    const inBacklog =
      !e.attended &&
      (BACKLOG_STATUSES.includes(e.status as (typeof BACKLOG_STATUSES)[number]) ||
        enrollmentIdsWithPayment.has(e.id));
    const paymentMethod = paymentMethodByEnrollmentId[e.id];
    const matchesPayment =
      !filters.paymentMethod ||
      filters.paymentMethod === "all" ||
      paymentMethod === filters.paymentMethod;
    const matchesBacklog = !filters.backlog || inBacklog;

    if (matchesPayment && matchesBacklog) {
      matchingPersonIds.add(e.person_id);
    }
  }

  if (filters.city && filters.city !== "all" && matchingPersonIds.size > 0) {
    const { data: peopleWithCity = [] } = await supabase
      .from("people")
      .select("id")
      .in("id", Array.from(matchingPersonIds))
      .eq("city", filters.city);
    matchingPersonIds = new Set(
      (peopleWithCity as { id: string }[]).map((p) => p.id)
    );
  }

  if (matchingPersonIds.size === 0) {
    const counts = await getPeopleCounts(supabase);
    return { people: [], counts };
  }

  const { data: rows = [] } = await supabase
    .from("people")
    .select("id, first_name, last_name, email, phone, city, created_at")
    .in("id", Array.from(matchingPersonIds))
    .order("created_at", { ascending: false });

  const people = rows as PersonRow[];
  const counts = await getPeopleCounts(supabase);
  return { people, counts };
}

async function getPeopleCounts(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PeopleCounts> {
  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, person_id, status, attended");

  type EnrollRow = {
    id: string;
    person_id: string;
    status: string;
    attended: boolean;
  };

  const enrollmentRowsTyped = (enrollmentRows ?? []) as EnrollRow[];
  const enrollmentIds = enrollmentRowsTyped.map((r) => r.id);
  const enrollmentIdToPersonId = new Map(
    enrollmentRowsTyped.map((r) => [r.id, r.person_id])
  );
  let enrollmentIdsWithPayment = new Set<string>();
  const personIdsByPaymentMethod: Record<string, Set<string>> = {};

  if (enrollmentIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("enrollment_id, method")
      .in("enrollment_id", enrollmentIds);

    if (payments) {
      for (const p of payments as { enrollment_id: string; method: string | null }[]) {
        enrollmentIdsWithPayment.add(p.enrollment_id);
        const m = p.method ?? "sin_pago";
        if (!personIdsByPaymentMethod[m]) personIdsByPaymentMethod[m] = new Set<string>();
        const personId = enrollmentIdToPersonId.get(p.enrollment_id);
        if (personId) personIdsByPaymentMethod[m].add(personId);
      }
    }
  }

  const paymentMethodCounts: Record<string, number> = {};
  for (const [method, set] of Object.entries(personIdsByPaymentMethod)) {
    paymentMethodCounts[method] = set.size;
  }

  const uniquePersonIds = [...new Set(enrollmentRowsTyped.map((r) => r.person_id))];
  const peopleByCity: Record<string, number> = {};
  let backlogTotal = 0;

  if (uniquePersonIds.length > 0) {
    const { data: peopleRows = [] } = await supabase
      .from("people")
      .select("id, city")
      .in("id", uniquePersonIds);
    for (const p of peopleRows as { id: string; city: string | null }[]) {
      const city = (p.city ?? "").trim() || "Sin ciudad";
      peopleByCity[city] = (peopleByCity[city] ?? 0) + 1;
    }
  }

  for (const e of enrollmentRowsTyped) {
    const inBacklog =
      !e.attended &&
      (BACKLOG_STATUSES.includes(e.status as (typeof BACKLOG_STATUSES)[number]) ||
        enrollmentIdsWithPayment.has(e.id));
    if (inBacklog) backlogTotal += 1;
  }

  return {
    total: uniquePersonIds.length,
    byCity: peopleByCity,
    byPaymentMethod: paymentMethodCounts,
    backlogTotal,
  };
}
