-- CI Intelligence MVP database schema
-- Run this script in Supabase SQL Editor.
-- This starter creates the core project and knowledge tables.
-- Enable and configure authentication/RLS policies before production use.

create extension if not exists pgcrypto;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.ci_projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  title text not null,
  department text,
  area text,
  owner text,
  project_type text default 'Kaizen',
  loss_category text default 'Cost',
  status text not null default 'On track'
    check (status in ('On track','At risk','Delayed','Completed','Cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  problem text,
  root_cause text,
  action text,
  actual_benefit numeric(14,2) not null default 0,
  target_benefit numeric(14,2) not null default 0,
  benefit_currency text not null default 'THB',
  start_date date,
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique,
  title text not null,
  project_id uuid references public.ci_projects(id) on delete set null,
  department text,
  loss_category text,
  project_type text,
  problem text,
  root_cause text,
  countermeasure text,
  result text,
  lessons_learned text,
  tags text[] not null default '{}',
  approved boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ci_projects(id) on delete cascade,
  update_note text not null,
  progress integer check (progress between 0 and 100),
  status text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_opportunities (
  id uuid primary key default gen_random_uuid(),
  signal_code text not null unique,
  area text not null,
  category text not null,
  metric text not null,
  baseline numeric,
  current_value numeric,
  unit text,
  severity text not null default 'Medium',
  explanation text,
  recommendation text,
  source_name text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text default 'Normal',
  due_date date,
  completed boolean not null default false,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ci_projects_status on public.ci_projects(status);
create index if not exists idx_ci_projects_department on public.ci_projects(department);
create index if not exists idx_ci_projects_area on public.ci_projects(area);
create index if not exists idx_knowledge_cases_tags on public.knowledge_cases using gin(tags);
create index if not exists idx_ai_opportunities_severity on public.ai_opportunities(severity);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ci_projects_updated_at on public.ci_projects;
create trigger trg_ci_projects_updated_at before update on public.ci_projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_knowledge_cases_updated_at on public.knowledge_cases;
create trigger trg_knowledge_cases_updated_at before update on public.knowledge_cases
for each row execute function public.set_updated_at();

-- RLS is enabled, but policies are intentionally not permissive by default.
-- Add organization-specific policies after defining your roles and membership model.
alter table public.departments enable row level security;
alter table public.ci_projects enable row level security;
alter table public.knowledge_cases enable row level security;
alter table public.project_updates enable row level security;
alter table public.ai_opportunities enable row level security;
alter table public.notifications enable row level security;

-- Example starter policy for authenticated users (replace with role/department rules).
-- create policy "authenticated users can read projects"
-- on public.ci_projects for select to authenticated using (true);
-- create policy "authenticated users can create projects"
-- on public.ci_projects for insert to authenticated with check (true);
-- Never expose the Supabase service_role key in frontend code.