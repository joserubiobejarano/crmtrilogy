import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getReportData } from "../actions";
import { buildReportContent, formatCurrency } from "../report-builder";
import { ReportViewClient } from "./ReportViewClient";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let data;
  try {
    data = await getReportData(eventId);
  } catch {
    notFound();
  }

  const content = buildReportContent(
    data,
    data.enrollments,
    data.notes
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/reports">← Volver a reportes</Link>
        </Button>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          Informe Cierre de {content.title}
        </h1>
      </header>

      <div className="rounded-md border bg-card p-6 text-sm space-y-4">
        <p>
          <span className="font-medium">Finalizó:</span> {content.endDate}
        </p>

        <div className="grid gap-1">
          <p>
            <span className="font-medium">Coordinador:</span> {content.coordinator}
          </p>
          <p>
            <span className="font-medium">Entrenadores:</span> {content.entrenadores}
          </p>
          <p>
            <span className="font-medium">Mentores:</span> {content.mentores}
          </p>
          <p>
            <span className="font-medium">Capitán mentores:</span> {content.capitanMentores}
          </p>
        </div>

        <p>
          <span className="font-medium">Participantes que iniciaron:</span> {content.participantesIniciaron}
        </p>
        <p>
          <span className="font-medium">Participantes que culminaron:</span> {content.participantesCulminaron}
        </p>

        <div>
          <p className="font-medium mb-2">Pagos</p>
          <ul className="list-none space-y-1">
            {content.paymentLines.map(({ method, count, sum }) =>
              count > 0 || sum > 0 ? (
                <li key={method}>
                  Pagos {method}: {count} participantes - {formatCurrency(sum)}
                </li>
              ) : null
            )}
          </ul>
          <p className="mt-2 font-medium">
            Total = {formatCurrency(content.total)}
          </p>
        </div>
      </div>

      <ReportViewClient eventId={eventId} initialContent={content} />
    </div>
  );
}
