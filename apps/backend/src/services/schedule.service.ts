import type Database from "better-sqlite3";
import type { ScheduleVO, UpdateScheduleBody } from "@tuanzi-photo/shared-types";

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
  let row = db.prepare("select * from schedule where id = 1").get() as ScheduleRow | undefined;

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

export function upsertSchedule(db: Database.Database, body: UpdateScheduleBody): ScheduleVO {
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
  ).run(body.refreshMode, body.timingHour, body.intervalHours, body.refreshRule, relatedTagsJson);

  return getSchedule(db);
}

export function pickPhotoForRefresh(db: Database.Database, schedule: ScheduleVO): number | null {
  const tags = schedule.relatedTags;
  let photoId: number | null = null;

  if (tags.length === 0) {
    if (schedule.refreshRule === "random") {
      const row = db.prepare("select id from photo order by random() limit 1").get() as { id: number } | undefined;
      photoId = row?.id ?? null;
    } else {
      const row = db.prepare("select id from photo order by created_at asc limit 1").get() as
        | { id: number }
        | undefined;
      photoId = row?.id ?? null;
    }
  } else {
    // 多标签取并集：照片拥有任意一个指定标签即可
    const placeholders = tags.map(() => "?").join(", ");
    const orderBy = schedule.refreshRule === "random" ? "random()" : "p.created_at asc";
    const row = db
      .prepare(
        `select distinct p.id from photo p
         join photo_tag pt on pt.photo_id = p.id
         join tag t on t.id = pt.tag_id
         where t.name in (${placeholders})
         order by ${orderBy} limit 1`
      )
      .get(...tags) as { id: number } | undefined;
    photoId = row?.id ?? null;
  }

  return photoId;
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
    return Math.floor(now.getTime() / 1000) + schedule.intervalHours * 3600;
  }
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
