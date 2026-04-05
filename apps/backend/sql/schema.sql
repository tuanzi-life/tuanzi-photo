-- 照片表
create table if not exists photo (
  id integer primary key,
  filename text not null,
  object_key text not null,
  created_at integer not null default (unixepoch())
);

-- 标签表
create table if not exists tag (
  id integer primary key,
  name text not null unique,
  created_at integer not null default (unixepoch())
);

-- 照片-标签关联表
create table if not exists photo_tag (
  photo_id integer not null references photo(id) on delete cascade,
  tag_id integer not null references tag(id) on delete cascade,
  primary key (photo_id, tag_id)
);

-- 定时刷新配置表（单行，id 固定为 1）
create table if not exists schedule (
  id integer primary key,
  refresh_mode text not null default 'timing' check (refresh_mode in ('timing', 'interval')),
  timing_hour integer not null default 8,
  interval_hours integer not null default 4,
  refresh_rule text not null default 'random' check (refresh_rule in ('time', 'random')),
  related_tags text not null default '',
  updated_at integer not null default (unixepoch())
);

-- 渲染历史表
create table if not exists render_history (
  id integer primary key,
  time integer not null default (unixepoch()),
  photo_id integer not null,
  type text not null check (type in ('manual', 'schedule')),
  result text not null
);

------------------------------------------------
--  注意：SQLite 的外键默认是关闭的，每次连接需要手动开启：
--  pragma foreign_keys = on;
--  用 better-sqlite3 的话，需要在建立连接后执行：
--  db.pragma('foreign_keys = ON')
--  否则 references 声明会被忽略，外键约束不生效。
------------------------------------------------
