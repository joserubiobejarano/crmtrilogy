/**
 * Standalone one-time Excel import script.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS (no session in CLI).
 *
 * Usage:
 *   npx tsx scripts/import-excel.ts <path-to.xlsx>
 *   node --import tsx scripts/import-excel.ts <path-to.xlsx>
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required).
 * Optional: .env.local or dotenv for IMPORT_CITY, IMPORT_START_DATE, IMPORT_END_DATE.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { runImport, type ImportEventDefaults } from "../lib/import-excel";

function defaultEventDefaults(): ImportEventDefaults {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return {
    city: process.env.IMPORT_CITY ?? "Import",
    start_date: process.env.IMPORT_START_DATE ?? start.toISOString(),
    end_date: process.env.IMPORT_END_DATE ?? end.toISOString(),
  };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-excel.ts <path-to.xlsx>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local)"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);
  const resolvedPath = resolve(process.cwd(), filePath);
  let buffer: Buffer;
  try {
    buffer = readFileSync(resolvedPath);
  } catch (err) {
    console.error("Failed to read file:", (err as NodeJS.ErrnoException).message);
    process.exit(1);
  }

  const eventDefaults = defaultEventDefaults();
  console.log("Event defaults:", eventDefaults);

  const result = await runImport(buffer, { supabase, eventDefaults });

  console.log("Import result:");
  console.log("  people created:", result.peopleCreated);
  console.log("  people updated:", result.peopleUpdated);
  console.log("  events created:", result.eventsCreated);
  console.log("  enrollments created:", result.enrollmentsCreated);
  console.log("  enrollments updated:", result.enrollmentsUpdated);
  console.log("  payments created:", result.paymentsCreated);
  if (result.errors.length > 0) {
    console.log("  errors:", result.errors.length);
    result.errors.forEach((e) =>
      console.log(`    [${e.sheet}] row ${e.row}: ${e.message}`)
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
