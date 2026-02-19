import type { EventRow, EnrollmentRow } from "@/app/app/events/types";
import { programTypeToDisplay } from "@/lib/program-display";

const PAYMENT_METHODS: { key: string; label: string }[] = [
  { key: "square", label: "Square" },
  { key: "afterpay", label: "Afterpay" },
  { key: "zelle", label: "Zelle" },
  { key: "cash", label: "Cash" },
  { key: "tdc", label: "TDC" },
];

export type ReportContent = {
  title: string;
  endDate: string;
  coordinator: string;
  entrenadores: string;
  mentores: string;
  capitanMentores: string;
  participantesIniciaron: number;
  participantesCulminaron: number;
  paymentLines: { method: string; count: number; sum: number }[];
  total: number;
  notes: string;
};

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatEndDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function buildReportContent(
  event: EventRow,
  enrollments: EnrollmentRow[],
  notes: string
): ReportContent {
  const title = `${programTypeToDisplay(event.program_type)} ${event.code}`;
  const attendedCount = enrollments.filter((e) => e.attended).length;
  const finalizedCount = enrollments.filter((e) => e.finalized).length;

  const paymentLines: { method: string; count: number; sum: number }[] = [];
  let total = 0;

  for (const { key, label } of PAYMENT_METHODS) {
    let count = 0;
    let sum = 0;
    for (const e of enrollments) {
      const amount = e.payments_by_method?.[key];
      if (amount != null && Number(amount) > 0) {
        count += 1;
        sum += Number(amount);
      }
    }
    total += sum;
    paymentLines.push({ method: label, count, sum });
  }

  return {
    title,
    endDate: formatEndDate(event.end_date),
    coordinator: event.coordinator?.trim() ?? "—",
    entrenadores: event.entrenadores?.trim() ?? "—",
    mentores: event.mentores?.trim() ?? "—",
    capitanMentores: event.capitan_mentores?.trim() ?? "—",
    participantesIniciaron: attendedCount,
    participantesCulminaron: finalizedCount,
    paymentLines,
    total,
    notes: notes?.trim() ?? "",
  };
}

/** Plain text version of the report for download. */
export function formatReportAsText(content: ReportContent): string {
  const lines: string[] = [
    `Informe Cierre de ${content.title}`,
    "",
    `Finalizó: ${content.endDate}`,
    "",
    `Coordinador: ${content.coordinator}`,
    `Entrenadores: ${content.entrenadores}`,
    `Mentores: ${content.mentores}`,
    `Capitán mentores: ${content.capitanMentores}`,
    "",
    `Participantes que iniciaron: ${content.participantesIniciaron}`,
    `Participantes que culminaron: ${content.participantesCulminaron}`,
    "",
    "Pagos",
  ];

  for (const { method, count, sum } of content.paymentLines) {
    if (count > 0 || sum > 0) {
      lines.push(
        `Pagos ${method}: ${count} participantes - ${formatCurrency(sum)}`
      );
    }
  }

  lines.push(`Total = ${formatCurrency(content.total)}`);
  lines.push("");
  lines.push("Notas");
  lines.push(content.notes || "(Sin notas)");

  return lines.join("\n");
}
