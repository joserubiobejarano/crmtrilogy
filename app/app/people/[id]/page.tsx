import { getPersonWithEnrollments } from "./actions";
import { PersonDetailView } from "./PersonDetailView";
import { getAuditLogForPerson } from "@/lib/audit-actions";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, auditEntries] = await Promise.all([
    getPersonWithEnrollments(id),
    getAuditLogForPerson(id),
  ]);
  return <PersonDetailView data={data} auditEntries={auditEntries} />;
}
