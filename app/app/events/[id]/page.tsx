import { getEventWithEnrollments } from "./actions";
import { EventCrmView } from "./EventCrmView";
import type { ViewFilter } from "@/app/app/events/types";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view: viewParam } = await searchParams;

  const view: ViewFilter =
    viewParam === "backlog" ||
    viewParam === "confirmed" ||
    viewParam === "attended" ||
    viewParam === "finalized"
      ? viewParam
      : null;

  const data = await getEventWithEnrollments(id, view);

  return <EventCrmView data={data} />;
}
