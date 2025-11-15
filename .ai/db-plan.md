### 1. List of tables with their columns, data types, and constraints

```sql
-- Required extension for UUID generation
create extension if not exists pgcrypto;

-- Optional: role assumption - Supabase uses auth.users for users table
-- We reference auth.users(id) (UUID) as the foreign key for user ownership.

-- 1) user_profiles: per-user profile and dietary preferences
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  diet text check (diet in ('none','vegan','vegetarian','pescatarian','keto','paleo','halal','kosher')) default 'none',
  allergens text[] default '{}',
  disliked_ingredients text[] default '{}',
  calorie_target int check (calorie_target > 0),
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) recipes: canonical user-owned recipe roots
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  content_json jsonb,
  is_public boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- At least one of content or content_json must be present
  constraint recipes_content_presence check (content is not null or content_json is not null)
);

-- Optional generated tsvector for simple text search
alter table public.recipes
  add column if not exists content_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) stored;

-- 3) recipe_variants: AI-modified versions or manual variants linked to a recipe
create table if not exists public.recipe_variants (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  parent_variant_id uuid references public.recipe_variants(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  model text,
  prompt text,
  preferences_snapshot jsonb,
  output_text text,
  output_json jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_variants_output_presence check (output_text is not null or output_json is not null)
);

-- 4) generation_logs: audit and metrics for success criteria and activity
create table if not exists public.generation_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  variant_id uuid references public.recipe_variants(id) on delete set null,
  action text not null check (action in ('generate','edit','delete')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Timestamps maintenance trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Attach triggers
drop trigger if exists set_updated_at_user_profiles on public.user_profiles;
create trigger set_updated_at_user_profiles
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_recipes on public.recipes;
create trigger set_updated_at_recipes
before update on public.recipes
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_recipe_variants on public.recipe_variants;
create trigger set_updated_at_recipe_variants
before update on public.recipe_variants
for each row execute function public.set_updated_at();
```

### 2. Relationships between tables

- user_profiles 1 — 1 auth.users
  - `user_profiles.user_id` references `auth.users(id)` (PK on `user_profiles`).
- recipes many — 1 auth.users
  - `recipes.user_id` references `auth.users(id)`; cascade delete.
- recipe_variants many — 1 recipes
  - `recipe_variants.recipe_id` references `recipes(id)`; cascade delete.
- recipe_variants optional self-reference (lineage)
  - `recipe_variants.parent_variant_id` references `recipe_variants(id)`; set null on delete.
- recipe_variants optional many — 1 auth.users
  - `recipe_variants.created_by` references `auth.users(id)`; set null on delete.
- generation_logs many — 1 auth.users
  - `generation_logs.user_id` references `auth.users(id)`; cascade delete.
- generation_logs optional many — 1 recipes
  - `generation_logs.recipe_id` references `recipes(id)`; set null on delete.
- generation_logs optional many — 1 recipe_variants
  - `generation_logs.variant_id` references `recipe_variants(id)`; set null on delete.

Cardinalities:
- A user has 0..1 profile.
- A user has 0..N recipes.
- A recipe has 0..N variants.
- A variant may have 0..N child variants (via `parent_variant_id`).
- A user has 0..N generation_logs.

### 3. Indexes

```sql
-- Ownership and listing
create index if not exists idx_recipes_user_created_at
  on public.recipes (user_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_recipe_variants_recipe_created_at
  on public.recipe_variants (recipe_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_recipe_variants_parent
  on public.recipe_variants (parent_variant_id)
  where deleted_at is null;

-- Text search
create index if not exists idx_recipes_content_tsv
  on public.recipes using gin (content_tsv)
  where deleted_at is null;

-- JSONB access (preferences and outputs)
create index if not exists idx_user_profiles_extra_gin
  on public.user_profiles using gin (extra);

create index if not exists idx_recipe_variants_prefs_gin
  on public.recipe_variants using gin (preferences_snapshot);

create index if not exists idx_recipe_variants_output_gin
  on public.recipe_variants using gin ((coalesce(output_json, '{}'::jsonb)));

-- Activity queries (weekly counts per user)
create index if not exists idx_generation_logs_user_created_at
  on public.generation_logs (user_id, created_at desc);

create index if not exists idx_generation_logs_recipe_variant
  on public.generation_logs (recipe_id, variant_id);
```

### 4. PostgreSQL policies (if applicable)

```sql
-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_variants enable row level security;
alter table public.generation_logs enable row level security;

-- Optionally, add a helper function for Supabase auth (auth.uid() is provided by Supabase)

-- user_profiles: owner-only access
drop policy if exists user_profiles_owner_select on public.user_profiles;
create policy user_profiles_owner_select
on public.user_profiles for select
using (user_id = auth.uid());

drop policy if exists user_profiles_owner_mod on public.user_profiles;
create policy user_profiles_owner_mod
on public.user_profiles for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- recipes: owner full access; public read when is_public = true; exclude soft-deleted
drop policy if exists recipes_owner_all on public.recipes;
create policy recipes_owner_all
on public.recipes for all
using (user_id = auth.uid() and deleted_at is null)
with check (user_id = auth.uid());

drop policy if exists recipes_public_read on public.recipes;
create policy recipes_public_read
on public.recipes for select
using ((is_public = true) and deleted_at is null);

-- recipe_variants: allowed if user owns parent recipe; public read if parent recipe is public; exclude soft-deleted
drop policy if exists recipe_variants_owner_all on public.recipe_variants;
create policy recipe_variants_owner_all
on public.recipe_variants for all
using (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_variants.recipe_id
      and r.user_id = auth.uid()
      and r.deleted_at is null
  )
  and recipe_variants.deleted_at is null
)
with check (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_variants.recipe_id
      and r.user_id = auth.uid()
      and r.deleted_at is null
  )
);

drop policy if exists recipe_variants_public_read on public.recipe_variants;
create policy recipe_variants_public_read
on public.recipe_variants for select
using (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_variants.recipe_id
      and r.is_public = true
      and r.deleted_at is null
  )
  and recipe_variants.deleted_at is null
);

-- generation_logs: owner read; owner insert; no public read
drop policy if exists generation_logs_owner_select on public.generation_logs;
create policy generation_logs_owner_select
on public.generation_logs for select
using (user_id = auth.uid());

drop policy if exists generation_logs_owner_insert on public.generation_logs;
create policy generation_logs_owner_insert
on public.generation_logs for insert
with check (user_id = auth.uid());

-- Optional: allow service role to bypass RLS for analytics jobs (handled via Supabase service key)
```

### 5. Any additional notes or explanations about design decisions

- Keys: All primary keys use UUIDs (`gen_random_uuid()`), and all ownership uses `auth.users(id)` for compatibility with Supabase Auth.
- Content storage: Both `content TEXT` and `content_json JSONB` are supported with a `CHECK` to ensure at least one is present, enabling a quick MVP with forward-compatible structure.
- Soft deletes: `deleted_at` on `recipes` and `recipe_variants`; policies and indexes exclude soft-deleted rows.
- Search: A generated `tsvector` on `recipes` enables simple full-text search; extend later to `ingredients` in JSONB if needed.
- Activity metrics: `generation_logs` supports success KPIs (e.g., weekly generations per user) and can be partitioned by time in the future if volume grows.