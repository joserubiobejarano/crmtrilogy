import { getAuditLogAll } from "@/lib/audit-actions";
import { AuditTimeline } from "@/components/audit-timeline";

export default async function HistorialPage() {
  const entries = await getAuditLogAll(100);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-semibold">Historial</h1>
      <p className="text-muted-foreground text-sm">
        Cambios recientes en todos los eventos.
      </p>
      <AuditTimeline entries={entries} emptyMessage="Sin cambios recientes." />
    </div>
  );
}
