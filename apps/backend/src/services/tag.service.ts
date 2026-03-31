import type Database from "better-sqlite3";
import type { TagVO } from "@tuanzi-photo/shared-types";

interface TagRow {
  id: number;
  name: string;
  count: number;
}

export function listTagsWithCount(db: Database.Database): TagVO[] {
  const rows = db
    .prepare(
      `select t.id, t.name, count(pt.photo_id) as count
       from tag t
       left join photo_tag pt on pt.tag_id = t.id
       group by t.id
       order by t.name`
    )
    .all() as TagRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    count: row.count,
  }));
}
