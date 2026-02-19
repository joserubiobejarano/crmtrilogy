import { listReports } from "./actions";
import { ReportsList } from "./ReportsList";

export default async function ReportsPage() {
  const reports = await listReports();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h2 className="text-2xl font-semibold">Reportes</h2>
      <ReportsList reports={reports} />
    </div>
  );
}
