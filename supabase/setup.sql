-- RhythmTraffic Chatbot - Supabase Setup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. Enable pgvector extension
-- =====================================================
create extension if not exists vector;

-- =====================================================
-- 2. Documents table (Knowledge Base)
-- =====================================================
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fast similarity search
create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for metadata filtering
create index if not exists documents_metadata_idx
  on documents using gin (metadata);

-- =====================================================
-- 3. Chat Sessions table (Conversation Memory)
-- =====================================================
create table if not exists chat_sessions (
  id text primary key,
  messages jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================================================
-- 4. Meeting Requests table (Booking Tracking)
-- =====================================================
create table if not exists meeting_requests (
  id bigserial primary key,
  email text not null,
  name text,
  phone text,
  session_id text references chat_sessions(id),
  status text default 'pending',
  preferred_time timestamp with time zone,
  context jsonb default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for quick lookup
create index if not exists meeting_requests_email_idx on meeting_requests(email);
create index if not exists meeting_requests_status_idx on meeting_requests(status);

-- =====================================================
-- 5. Vector Search Function
-- =====================================================
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where
    case
      when filter = '{}'::jsonb then true
      else documents.metadata @> filter
    end
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- =====================================================
-- 6. Get Chat Session Function
-- =====================================================
create or replace function get_chat_session(session_id text)
returns json
language plpgsql
as $$
declare
  result json;
begin
  select json_build_object(
    'id', id,
    'messages', messages,
    'metadata', metadata,
    'created_at', created_at,
    'updated_at', updated_at
  ) into result
  from chat_sessions
  where id = session_id;

  return coalesce(result, '{}'::json);
end;
$$;

-- =====================================================
-- 7. Insert Document Function (with embedding)
-- =====================================================
create or replace function insert_document(
  p_content text,
  p_metadata jsonb,
  p_embedding vector(1536)
)
returns bigint
language plpgsql
as $$
declare
  new_id bigint;
begin
  insert into documents (content, metadata, embedding)
  values (p_content, p_metadata, p_embedding)
  returning id into new_id;

  return new_id;
end;
$$;

-- =====================================================
-- 8. Update timestamps trigger
-- =====================================================
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to tables
drop trigger if exists documents_updated_at on documents;
create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

drop trigger if exists chat_sessions_updated_at on chat_sessions;
create trigger chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_updated_at();

drop trigger if exists meeting_requests_updated_at on meeting_requests;
create trigger meeting_requests_updated_at
  before update on meeting_requests
  for each row execute function update_updated_at();

-- =====================================================
-- 9. Row Level Security (RLS) - IMPORTANT
-- =====================================================
-- OPTION A: Disable RLS (simpler, use if n8n uses service_role key)
-- If you use the service_role key in n8n, RLS is bypassed automatically.
-- Just make sure NOT to expose the service_role key to the browser.

-- OPTION B: Enable RLS with policies (more secure)
-- Uncomment below if you want RLS enabled:

-- alter table documents enable row level security;
-- alter table chat_sessions enable row level security;
-- alter table meeting_requests enable row level security;

-- Policy: Allow all operations for authenticated service role
-- create policy "Service role full access - documents"
--   on documents for all
--   using (true)
--   with check (true);

-- create policy "Service role full access - chat_sessions"
--   on chat_sessions for all
--   using (true)
--   with check (true);

-- create policy "Service role full access - meeting_requests"
--   on meeting_requests for all
--   using (true)
--   with check (true);

-- NOTE: The service_role key bypasses RLS by default in Supabase.
-- Only enable RLS if you plan to use anon key or have specific access control needs.

-- =====================================================
-- 10. Sample data (optional - remove in production)
-- =====================================================
-- Insert a sample document to test
-- insert into documents (content, metadata) values (
--   'RhythmTraffic provides innovative traffic solutions for modern cities.',
--   '{"source": "website", "page": "home"}'::jsonb
-- );

-- =====================================================
-- Verification queries
-- =====================================================
-- Run these to verify setup:

-- Check tables exist
-- select table_name from information_schema.tables
-- where table_schema = 'public'
-- and table_name in ('documents', 'chat_sessions', 'meeting_requests');

-- Check functions exist
-- select routine_name from information_schema.routines
-- where routine_schema = 'public'
-- and routine_name in ('match_documents', 'get_chat_session', 'insert_document');

-- Check vector extension
-- select * from pg_extension where extname = 'vector';
