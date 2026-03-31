import type Database from "better-sqlite3";
import type { PhotoVO } from "@tuanzi-photo/shared-types";
import { getPhotoURL } from "./oss.service.js";

interface PhotoRow {
  id: number;
  filename: string;
  object_key: string;
  created_at: number;
}

async function rowToVO(row: PhotoRow, tags: string[]): Promise<PhotoVO> {
  return {
    id: row.id,
    filename: row.filename,
    url: await getPhotoURL(row.object_key),
    tags,
    createdAt: row.created_at,
  };
}

export async function listPhotos(db: Database.Database, tags?: string[]): Promise<PhotoVO[]> {
  let photoRows: PhotoRow[];

  if (!tags || tags.length === 0) {
    photoRows = db
      .prepare("select id, filename, object_key, created_at from photo order by created_at desc")
      .all() as PhotoRow[];
  } else {
    // 多标签取并集：照片拥有任意一个指定标签即可，用 distinct 去重
    const placeholders = tags.map(() => "?").join(", ");
    photoRows = db
      .prepare(
        `select distinct p.id, p.filename, p.object_key, p.created_at
         from photo p
         join photo_tag pt on pt.photo_id = p.id
         join tag t on t.id = pt.tag_id
         where t.name in (${placeholders})
         order by p.created_at desc`
      )
      .all(...tags) as PhotoRow[];
  }

  return Promise.all(photoRows.map((row) => rowToVO(row, getTagsForPhoto(db, row.id))));
}

export async function getPhotoById(db: Database.Database, id: number): Promise<PhotoVO | null> {
  const row = db.prepare("select id, filename, object_key, created_at from photo where id = ?").get(id) as
    | PhotoRow
    | undefined;
  if (!row) return null;
  return rowToVO(row, getTagsForPhoto(db, row.id));
}

export async function createPhoto(
  db: Database.Database,
  filename: string,
  objectKey: string,
  tags: string[]
): Promise<PhotoVO> {
  const result = db.prepare("insert into photo (filename, object_key) values (?, ?)").run(filename, objectKey);
  const photoId = result.lastInsertRowid as number;

  if (tags.length > 0) {
    db.transaction(() => {
      for (const name of tags) {
        db.prepare("insert or ignore into tag (name) values (?)").run(name);
        const tag = db.prepare("select id from tag where name = ?").get(name) as { id: number };
        db.prepare("insert or ignore into photo_tag (photo_id, tag_id) values (?, ?)").run(photoId, tag.id);
      }
    })();
  }

  return (await getPhotoById(db, photoId))!;
}

export function deletePhoto(db: Database.Database, id: number): string | null {
  const row = db.prepare("select object_key from photo where id = ?").get(id) as { object_key: string } | undefined;
  if (!row) return null;
  db.prepare("delete from photo where id = ?").run(id);
  return row.object_key;
}

function getTagsForPhoto(db: Database.Database, photoId: number): string[] {
  const rows = db
    .prepare("select t.name from tag t join photo_tag pt on pt.tag_id = t.id where pt.photo_id = ?")
    .all(photoId) as { name: string }[];
  return rows.map((r) => r.name);
}
