"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EditEventModal } from "./EditEventModal";
import { DuplicateEventModal } from "./DuplicateEventModal";
import { scheduleEventDeletion, cancelEventDeletion } from "./actions";
import type { EventRow } from "./types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { programTypeToDisplay } from "@/lib/program-display";
import type { CityRow, ProgramTypeRow } from "@/app/app/administration/actions";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "short",
    });
  } catch {
    return iso;
  }
}

function programTypeLabel(programTypes: ProgramTypeRow[], code: string): string {
  const pt = programTypes.find((p) => p.code === code);
  return pt ? pt.label : programTypeToDisplay(code);
}

export function EventsTable({
  rows,
  cities,
  programTypes,
}: {
  rows: EventRow[];
  cities: CityRow[];
  programTypes: ProgramTypeRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editEvent, setEditEvent] = useState<EventRow | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<EventRow | null>(null);
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterProgram, setFilterProgram] = useState<string>("");

  const handleScheduleDeletion = (event: EventRow) => {
    if (
      !confirm(
        "¿Eliminar este evento? Se eliminará permanentemente en 7 días. Los participantes permanecerán en la app. Durante estos 7 días puedes cancelar la eliminación."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await scheduleEventDeletion(event.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  const handleCancelDeletion = (eventId: string) => {
    startTransition(async () => {
      const result = await cancelEventDeletion(eventId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  const filteredRows = useMemo(() => {
    return rows.filter((event) => {
      if (filterCity && event.city !== filterCity) return false;
      if (filterProgram && event.program_type !== filterProgram) return false;
      return true;
    });
  }, [rows, filterCity, filterProgram]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-city" className="text-sm font-medium text-muted-foreground">
            Ciudad
          </label>
          <div className="relative inline-block">
            <select
              id="filter-city"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className={cn(
                "border-input h-9 w-full min-w-[6rem] rounded-none border bg-transparent pl-3 pr-8 py-1 text-sm shadow-xs appearance-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              )}
            >
              <option value="">Todas</option>
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 shrink-0 opacity-70"
              aria-hidden
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-program" className="text-sm font-medium text-muted-foreground">
            Programa
          </label>
          <div className="relative inline-block">
            <select
              id="filter-program"
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className={cn(
                "border-input h-9 w-full min-w-[6rem] rounded-none border bg-transparent pl-3 pr-8 py-1 text-sm shadow-xs appearance-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              )}
            >
              <option value="">Todos</option>
              {programTypes.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} — {p.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 shrink-0 opacity-70"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-black text-white">
              <th className="px-4 py-3 text-left font-medium">Programa</th>
              <th className="px-4 py-3 text-left font-medium">Número</th>
              <th className="px-4 py-3 text-left font-medium">Ciudad</th>
              <th className="px-4 py-3 text-left font-medium">Coordinador</th>
              <th className="px-4 py-3 text-left font-medium">Inicio</th>
              <th className="px-4 py-3 text-left font-medium">Fin</th>
              <th className="min-w-[12rem] px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aún no hay eventos. Crea uno con «Nuevo entrenamiento».
                </td>
              </tr>
            ) : (
              filteredRows.map((event) => (
                <tr
                  key={event.id}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/app/events/${event.id}`)}
                >
                  <td className="px-4 py-3">{programTypeLabel(programTypes, event.program_type)}</td>
                  <td className="px-4 py-3">{event.code}</td>
                  <td className="px-4 py-3">{event.city}</td>
                  <td className="px-4 py-3">{event.coordinator ?? "—"}</td>
                  <td className="px-4 py-3">
                    {event.start_date != null ? formatDate(event.start_date) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {event.end_date != null ? formatDate(event.end_date) : "—"}
                  </td>
                  <td className="min-w-[12rem] px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end gap-2">
                      {event.scheduled_deletion_at ? (
                        <>
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Eliminación programada para{" "}
                            {formatDate(event.scheduled_deletion_at)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelDeletion(event.id);
                            }}
                          >
                            Cancelar eliminación
                          </Button>
                        </>
                      ) : (
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`/form/e/${event.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Formulario
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditEvent(event);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDuplicateSource(event);
                            }}
                          >
                            Duplicar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleDeletion(event);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditEventModal
        open={editEvent !== null}
        onOpenChange={(open) => !open && setEditEvent(null)}
        event={editEvent}
        cities={cities}
        programTypes={programTypes}
      />
      <DuplicateEventModal
        open={duplicateSource !== null}
        onOpenChange={(open) => !open && setDuplicateSource(null)}
        sourceEvent={duplicateSource}
        cities={cities}
        programTypes={programTypes}
      />
    </>
  );
}
