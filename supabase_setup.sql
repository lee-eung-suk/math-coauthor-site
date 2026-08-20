-- ══════════════════════════════════════════════════════════════
--  대한민국 수학교육상 초등 부문 공동집필 홈페이지 — 댓글 테이블
--  Supabase 대시보드 → SQL Editor → New query → 전체 붙여넣기 → Run
-- ══════════════════════════════════════════════════════════════

create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  topic_id    text        not null,
  author      text        not null,
  body        text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_topic_created_idx
  on public.comments (topic_id, created_at);

-- 내용 길이 제한 (장난성 대량 입력 방지)
alter table public.comments
  drop constraint if exists comments_body_len;
alter table public.comments
  add constraint comments_body_len
  check (char_length(body) between 1 and 2000 and char_length(author) between 1 and 40);

-- ── 접근 권한 ──────────────────────────────────────────────
-- 링크를 아는 사람이 읽고 쓰고 지울 수 있는 단순 구조입니다.
-- (네 분이 쓰는 비공개 작업 페이지 기준. 로그인 절차를 넣지 않습니다.)
alter table public.comments enable row level security;

drop policy if exists "read all"   on public.comments;
drop policy if exists "insert all" on public.comments;
drop policy if exists "delete all" on public.comments;

create policy "read all"   on public.comments for select using (true);
create policy "insert all" on public.comments for insert with check (true);
create policy "delete all" on public.comments for delete using (true);

-- ── 확인 ──────────────────────────────────────────────────
select tablename, rowsecurity as "RLS 켜짐"
from pg_tables where schemaname = 'public' and tablename = 'comments';
