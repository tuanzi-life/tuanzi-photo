import type Database from "better-sqlite3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { paths } from "#paths";

export type RenderTriggerType = "manual" | "schedule";

export interface RenderHistoryLogger {
  warn(payload: object, message: string): void;
}

interface RenderCountSnapshot {
  manual: number;
  schedule: number;
}

type RenderHistoryFile = Record<string, RenderCountSnapshot>;

interface RenderCountRow {
  photo_id: number;
  manual_count: number;
  schedule_count: number;
}

const ZERO_COUNTS = Object.freeze({ manual: 0, schedule: 0 });

export async function recordRenderSuccess(
  db: Database.Database,
  photoId: number,
  type: RenderTriggerType,
  logger?: RenderHistoryLogger
): Promise<void> {
  insertRenderHistory(db, photoId, type, "success");

  try {
    await updateRenderSnapshot(db, photoId, type);
  } catch (error) {
    logger?.warn({ err: error, photoId, type }, "写入 render_history.json 失败");
  }
}

export function recordRenderFailure(
  db: Database.Database,
  photoId: number,
  type: RenderTriggerType,
  error: unknown
): void {
  insertRenderHistory(db, photoId, type, stringifyFailureReason(error));
}

export async function getRenderCountTotals(
  db: Database.Database,
  photoIds: number[]
): Promise<Map<number, number>> {
  const snapshot = await loadRenderSnapshotOrFallback(db);
  const totals = new Map<number, number>();

  for (const photoId of photoIds) {
    const counts = snapshot[String(photoId)] ?? ZERO_COUNTS;
    totals.set(photoId, counts.manual + counts.schedule);
  }

  return totals;
}

function insertRenderHistory(
  db: Database.Database,
  photoId: number,
  type: RenderTriggerType,
  result: string
): void {
  db.prepare(
    `insert into render_history (time, photo_id, type, result)
     values (unixepoch(), ?, ?, ?)`
  ).run(photoId, type, result);
}

async function updateRenderSnapshot(
  db: Database.Database,
  photoId: number,
  type: RenderTriggerType
): Promise<void> {
  await mkdir(paths.mainDir, { recursive: true });

  const snapshot = await loadRenderSnapshotOrFallback(db);
  const key = String(photoId);
  const current = snapshot[key] ?? { manual: 0, schedule: 0 };

  current[type] += 1;
  snapshot[key] = current;

  await writeFile(paths.renderHistoryFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf-8");
}

async function loadRenderSnapshotOrFallback(
  db: Database.Database
): Promise<RenderHistoryFile> {
  try {
    return normalizeRenderHistoryFile(
      JSON.parse(await readFile(paths.renderHistoryFile, "utf-8")) as unknown
    );
  } catch {
    return buildRenderSnapshotFromDb(db);
  }
}

function buildRenderSnapshotFromDb(db: Database.Database): RenderHistoryFile {
  const rows = db
    .prepare(
      `select
         photo_id,
         sum(case when type = 'manual' and result = 'success' then 1 else 0 end) as manual_count,
         sum(case when type = 'schedule' and result = 'success' then 1 else 0 end) as schedule_count
       from render_history
       where result = 'success'
       group by photo_id`
    )
    .all() as RenderCountRow[];

  const snapshot: RenderHistoryFile = {};

  for (const row of rows) {
    if (row.manual_count <= 0 && row.schedule_count <= 0) {
      continue;
    }

    snapshot[String(row.photo_id)] = {
      manual: row.manual_count,
      schedule: row.schedule_count,
    };
  }

  return snapshot;
}

function normalizeRenderHistoryFile(input: unknown): RenderHistoryFile {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const output: RenderHistoryFile = {};

  for (const [photoId, value] of Object.entries(input)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const manual =
      typeof value.manual === "number" && Number.isFinite(value.manual) && value.manual > 0
        ? Math.floor(value.manual)
        : 0;
    const schedule =
      typeof value.schedule === "number" &&
      Number.isFinite(value.schedule) &&
      value.schedule > 0
        ? Math.floor(value.schedule)
        : 0;

    if (manual <= 0 && schedule <= 0) {
      continue;
    }

    output[photoId] = { manual, schedule };
  }

  return output;
}

function stringifyFailureReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
