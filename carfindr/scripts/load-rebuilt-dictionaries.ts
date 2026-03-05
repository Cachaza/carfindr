import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { notInArray, sql } from "drizzle-orm";
import { marcas, modelos } from "../src/server/db/schema";

type Args = {
  brandsCsv: string;
  modelsCsv: string;
  dryRun: boolean;
  prune: boolean;
  databaseUrl?: string;
};

type BrandInput = {
  label: string;
  cochesNetId: string;
  milanunciosId: string;
  wallapopId: string;
  cochesComId: string;
};

type ModelInput = {
  cochesNetMarcaId: string;
  cochesNetModeloId: string;
  milanunciosMarcaId: string;
  milanunciosModeloId: string;
  wallapopMarcaId: string;
  wallapopModeloId: string;
  cochesComMarcaId: string;
  cochesComModeloId: string;
};

const INVALID_VALUES = new Set([
  "",
  "none",
  "null",
  "undefined",
  "nan",
  "n/a",
  "no tiene",
]);

function parseArgs(argv: string[]): Args {
  const args: Args = {
    brandsCsv: "../PoC/dictionary-rebuild/output/dictionary_marcas_rebuilt.csv",
    modelsCsv: "../PoC/dictionary-rebuild/output/dictionary_modelos_rebuilt.csv",
    dryRun: false,
    prune: false,
    databaseUrl: process.env.DATABASE_URL,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--prune") {
      args.prune = true;
      continue;
    }
    if (arg === "--brands-csv") {
      args.brandsCsv = argv[++i] ?? args.brandsCsv;
      continue;
    }
    if (arg === "--models-csv") {
      args.modelsCsv = argv[++i] ?? args.modelsCsv;
      continue;
    }
    if (arg === "--database-url") {
      args.databaseUrl = argv[++i] ?? args.databaseUrl;
      continue;
    }
  }

  return args;
}

function normalizeNullable(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (INVALID_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += ch;
  }

  values.push(current);
  return values;
}

async function readCsvRows<T extends Record<string, string>>(
  filePath: string,
): Promise<T[]> {
  const content = await readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0] ?? "");
  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j] ?? ""] = values[j] ?? "";
    }
    rows.push(row as T);
  }

  return rows;
}

function toIntOrThrow(value: string | undefined, fieldName: string): number {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer in ${fieldName}: ${value ?? "<empty>"}`);
  }
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const brandsPath = path.resolve(cwd, args.brandsCsv);
  const modelsPath = path.resolve(cwd, args.modelsCsv);

  const brandRows = await readCsvRows<BrandInput>(brandsPath);
  const modelRows = await readCsvRows<ModelInput>(modelsPath);

  const brandValues = brandRows
    .map((row) => ({
      label: normalizeNullable(row.label) ?? "UNKNOWN",
      cochesNetId: toIntOrThrow(row.cochesNetId, "cochesNetId"),
      milanunciosId: normalizeNullable(row.milanunciosId),
      wallapopId: normalizeNullable(row.wallapopId),
      cochesComId: normalizeNullable(row.cochesComId),
    }))
    .filter((row) => Number.isFinite(row.cochesNetId));

  const modelValues = modelRows
    .map((row) => ({
      cochesNetMarcaId: toIntOrThrow(row.cochesNetMarcaId, "cochesNetMarcaId"),
      cochesNetModeloId: toIntOrThrow(row.cochesNetModeloId, "cochesNetModeloId"),
      milanunciosMarcaId: normalizeNullable(row.milanunciosMarcaId),
      milanunciosModeloId: normalizeNullable(row.milanunciosModeloId),
      wallapopMarcaId: normalizeNullable(row.wallapopMarcaId),
      wallapopModeloId: normalizeNullable(row.wallapopModeloId),
      cochesComMarcaId: normalizeNullable(row.cochesComMarcaId),
      cochesComModeloId: normalizeNullable(row.cochesComModeloId),
    }))
    .filter((row) => Number.isFinite(row.cochesNetModeloId));

  console.log(`Prepared brands: ${brandValues.length}`);
  console.log(`Prepared models: ${modelValues.length}`);
  console.log(`Brands CSV: ${brandsPath}`);
  console.log(`Models CSV: ${modelsPath}`);

  if (args.dryRun) {
    console.log("Dry-run mode: no changes written to DB.");
    return;
  }

  if (!args.databaseUrl) {
    throw new Error(
      "DATABASE_URL not found. Set env var or pass --database-url.",
    );
  }

  const client = postgres(args.databaseUrl);
  const db = drizzle(client);

  try {
    await db.transaction(async (tx) => {
      if (brandValues.length > 0) {
        await tx
          .insert(marcas)
          .values(brandValues)
          .onConflictDoUpdate({
            target: marcas.cochesNetId,
            set: {
              label: sql`excluded.label`,
              milanunciosId: sql`excluded.milanunciosid`,
              wallapopId: sql`excluded.wallapopid`,
              cochesComId: sql`excluded.cochescomid`,
            },
          });
      }

      if (modelValues.length > 0) {
        await tx
          .insert(modelos)
          .values(modelValues)
          .onConflictDoUpdate({
            target: modelos.cochesNetModeloId,
            set: {
              cochesNetMarcaId: sql`excluded.cochesnetmarcaid`,
              milanunciosMarcaId: sql`excluded.milanunciosmarcaid`,
              milanunciosModeloId: sql`excluded.milanunciosmodeloid`,
              wallapopMarcaId: sql`excluded.wallapopmarcaid`,
              wallapopModeloId: sql`excluded.wallapopmodeloid`,
              cochesComMarcaId: sql`excluded.cochescommarcaid`,
              cochesComModeloId: sql`excluded.cochescommodeloid`,
            },
          });
      }

      if (args.prune) {
        const modelIds = modelValues.map((row) => row.cochesNetModeloId);
        const brandIds = brandValues.map((row) => row.cochesNetId);

        if (modelIds.length > 0) {
          await tx
            .delete(modelos)
            .where(notInArray(modelos.cochesNetModeloId, modelIds));
        }

        if (brandIds.length > 0) {
          await tx.delete(marcas).where(notInArray(marcas.cochesNetId, brandIds));
        }
      }
    });

    console.log("Dictionary load completed successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed loading dictionaries:", error);
  process.exitCode = 1;
});
