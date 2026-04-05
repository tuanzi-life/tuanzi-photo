import type Database from "better-sqlite3";
import type { ScheduleVO, UpdateScheduleBody } from "@tuanzi-photo/shared-types";
import { getRenderCountTotals } from "./render-history.service.js";

interface ScheduleRow {
  id: number;
  refresh_mode: "timing" | "interval";
  timing_hour: number;
  interval_hours: number;
  refresh_rule: "time" | "random";
  related_tags: string;
  updated_at: number;
}

const DEFAULT_SCHEDULE: Omit<ScheduleRow, "id" | "updated_at"> = {
  refresh_mode: "timing",
  timing_hour: 8,
  interval_hours: 4,
  refresh_rule: "random",
  related_tags: "[]",
};

export function getSchedule(db: Database.Database): ScheduleVO {
  let row = db.prepare("select * from schedule where id = 1").get() as
    | ScheduleRow
    | undefined;

  if (!row) {
    db.prepare(
      `insert into schedule (id, refresh_mode, timing_hour, interval_hours, refresh_rule, related_tags)
       values (1, ?, ?, ?, ?, ?)`
    ).run(
      DEFAULT_SCHEDULE.refresh_mode,
      DEFAULT_SCHEDULE.timing_hour,
      DEFAULT_SCHEDULE.interval_hours,
      DEFAULT_SCHEDULE.refresh_rule,
      DEFAULT_SCHEDULE.related_tags
    );
    row = db.prepare("select * from schedule where id = 1").get() as ScheduleRow;
  }

  return rowToVO(row);
}

export function upsertSchedule(
  db: Database.Database,
  body: UpdateScheduleBody
): ScheduleVO {
  const relatedTagsJson = JSON.stringify(body.relatedTags);

  db.prepare(
    `insert into schedule (id, refresh_mode, timing_hour, interval_hours, refresh_rule, related_tags, updated_at)
     values (1, ?, ?, ?, ?, ?, unixepoch())
     on conflict(id) do update set
       refresh_mode = excluded.refresh_mode,
       timing_hour = excluded.timing_hour,
       interval_hours = excluded.interval_hours,
       refresh_rule = excluded.refresh_rule,
       related_tags = excluded.related_tags,
       updated_at = excluded.updated_at`
  ).run(
    body.refreshMode,
    body.timingHour,
    body.intervalHours,
    body.refreshRule,
    relatedTagsJson
  );

  return getSchedule(db);
}

interface CandidatePhotoRow {
  id: number;
  created_at: number;
}

export async function pickPhotoForRefresh(
  db: Database.Database,
  schedule: ScheduleVO
): Promise<number | null> {
  const candidates = listCandidatePhotos(db, schedule.relatedTags);
  if (candidates.length === 0) {
    return null;
  }

  const totals = await getRenderCountTotals(
    db,
    candidates.map((candidate) => candidate.id)
  );

  let minRenderCount = Number.POSITIVE_INFINITY;
  const minCandidates: CandidatePhotoRow[] = [];

  for (const candidate of candidates) {
    const renderCount = totals.get(candidate.id) ?? 0;

    if (renderCount < minRenderCount) {
      minRenderCount = renderCount;
      minCandidates.length = 0;
      minCandidates.push(candidate);
      continue;
    }

    if (renderCount === minRenderCount) {
      minCandidates.push(candidate);
    }
  }

  if (minCandidates.length === 0) {
    return null;
  }

  if (schedule.refreshRule === "time") {
    minCandidates.sort((left, right) => left.created_at - right.created_at);
    return minCandidates[0]?.id ?? null;
  }

  const index = Math.floor(Math.random() * minCandidates.length);
  return minCandidates[index]?.id ?? null;
}

export function shouldTriggerNow(schedule: ScheduleVO, now = new Date()): boolean {
  if (now.getMinutes() !== 0) {
    return false;
  }

  if (schedule.refreshMode === "timing") {
    return now.getHours() === schedule.timingHour;
  }

  return now.getHours() % schedule.intervalHours === 0;
}

export function calcNextRefreshTime(schedule: ScheduleVO): number {
  const now = new Date();

  if (schedule.refreshMode === "timing") {
    const next = new Date(now);
    next.setHours(schedule.timingHour, 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return Math.floor(next.getTime() / 1000);
  } else {
    const next = new Date(now);
    next.setMinutes(0, 0, 0);

    do {
      next.setHours(next.getHours() + 1);
    } while (next.getHours() % schedule.intervalHours !== 0);

    return Math.floor(next.getTime() / 1000);
  }
}

function listCandidatePhotos(
  db: Database.Database,
  tags: string[]
): CandidatePhotoRow[] {
  if (tags.length === 0) {
    return db
      .prepare("select id, created_at from photo")
      .all() as CandidatePhotoRow[];
  }

  const placeholders = tags.map(() => "?").join(", ");
  return db
    .prepare(
      `select distinct p.id, p.created_at from photo p
       join photo_tag pt on pt.photo_id = p.id
       join tag t on t.id = pt.tag_id
       where t.name in (${placeholders})`
    )
    .all(...tags) as CandidatePhotoRow[];
}

function rowToVO(row: ScheduleRow): ScheduleVO {
  let relatedTags: string[] = [];
  try {
    relatedTags = JSON.parse(row.related_tags);
  } catch {
    relatedTags = [];
  }

  const vo: ScheduleVO = {
    refreshMode: row.refresh_mode,
    timingHour: row.timing_hour,
    intervalHours: row.interval_hours,
    refreshRule: row.refresh_rule,
    relatedTags,
    nextRefreshTime: 0,
  };
  vo.nextRefreshTime = calcNextRefreshTime(vo);
  return vo;
}
