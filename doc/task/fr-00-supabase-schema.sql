create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  description varchar(255),
  role varchar(50) not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists day_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  date date not null,
  average_score integer check (average_score between 0 and 100),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists audio_sources (
  id uuid primary key default gen_random_uuid(),
  day_record_id uuid not null references day_records(id),
  type text not null check (type in ('file', 'youtube')),
  storage_path text,
  url text,
  file_name text,
  file_type text,
  created_at timestamptz default now()
);

create table if not exists dictation_sessions (
  id uuid primary key default gen_random_uuid(),
  day_record_id uuid not null references day_records(id),
  difficulty text not null default 'med' check (difficulty in ('easy', 'med', 'hard')),
  user_input text,
  answer_key text,
  keyword text,
  answer_pdf_path text,
  total_score integer check (total_score between 0 and 100),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists session_audio_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references dictation_sessions(id) on delete cascade,
  audio_source_id uuid not null references audio_sources(id) on delete cascade,
  created_at timestamptz default now(),
  unique (session_id, audio_source_id)
);

create table if not exists sentences (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references dictation_sessions(id) on delete cascade,
  sentence_index integer not null,
  user_text text not null,
  answer_text text not null,
  score integer not null check (score between 0 and 100),
  created_at timestamptz default now()
);

create index if not exists idx_day_records_user_date on day_records (user_id, date);
create index if not exists idx_sessions_day_record on dictation_sessions (day_record_id);
create index if not exists idx_sentences_session on sentences (session_id);
