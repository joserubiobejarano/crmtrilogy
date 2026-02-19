import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runImport,
  type ImportEventDefaults,
} from "@/lib/import-excel";

function defaultEventDefaults(): ImportEventDefaults {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return {
    city: "Import",
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // When set, only this email can use the import endpoint; when unset, any authenticated user can import.
  const adminEmail = process.env.IMPORT_ADMIN_EMAIL;
  if (adminEmail && session.user?.email !== adminEmail) {
    return NextResponse.json(
      { error: "Forbidden: admin only" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing or invalid file (use field name 'file')" },
      { status: 400 }
    );
  }

  const city = formData.get("city");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");

  const defaults = defaultEventDefaults();
  let startIso = defaults.start_date;
  let endIso = defaults.end_date;
  if (typeof start_date === "string" && start_date.trim()) {
    const d = new Date(start_date.trim());
    if (!Number.isNaN(d.getTime())) startIso = d.toISOString();
  }
  if (typeof end_date === "string" && end_date.trim()) {
    const d = new Date(end_date.trim());
    if (!Number.isNaN(d.getTime())) endIso = d.toISOString();
  }

  const eventDefaults: ImportEventDefaults = {
    city: typeof city === "string" && city.trim() ? city.trim() : defaults.city,
    start_date: startIso,
    end_date: endIso,
  };

  let buffer: Buffer;
  try {
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 400 }
    );
  }

  try {
    const result = await runImport(buffer, {
      supabase,
      eventDefaults,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
