-- Лень-в-Пень Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
create extension if not exists pgcrypto;

-- ============================================
-- USERS TABLE
-- ============================================
create table users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  country text,
  city text,
  profession text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table users enable row level security;

create policy "Users can view own data"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on users for update
  using (auth.uid() = id);

-- ============================================
-- MAIN GOAL TABLE
-- ============================================
create table main_goal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  text text not null check (char_length(text) >= 8),
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table main_goal enable row level security;

create policy "Users can manage own goals"
  on main_goal for all
  using (user_id in (select id from users where auth.uid() = id));

-- ============================================
-- DEPENDENCIES CATALOG
-- ============================================
create table dependencies (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text,
  icon text,
  category text
);

-- Seed data for dependencies
insert into dependencies (key, title, description, category) values
  ('smoking', 'Курение', 'Табачная зависимость', 'health'),
  ('phone', 'Телефон', 'Чрезмерное использование смартфона', 'digital'),
  ('alcohol', 'Алкоголь', 'Употребление алкоголя', 'health'),
  ('overeating', 'Переедание', 'Нездоровое питание', 'health'),
  ('procrastination', 'Прокрастинация', 'Откладывание дел', 'productivity'),
  ('social_media', 'Соцсети', 'Зависимость от социальных сетей', 'digital'),
  ('gaming', 'Видеоигры', 'Игровая зависимость', 'digital'),
  ('shopping', 'Шопинг', 'Компульсивные покупки', 'finance'),
  ('caffeine', 'Кофеин', 'Чрезмерное употребление кофе/энергетиков', 'health'),
  ('drugs', 'Наркотики', 'Наркотическая зависимость (требует профессиональной помощи)', 'critical');

alter table dependencies enable row level security;

create policy "Anyone can view dependencies"
  on dependencies for select
  using (true);

-- ============================================
-- USER DEPENDENCIES (CARDS)
-- ============================================
create table user_dependencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  dependency_id uuid references dependencies(id) on delete cascade,
  
  -- Base parameters (user input)
  base_harm int check (base_harm between 1 and 10),
  base_difficulty int check (base_difficulty between 1 and 10),
  base_frequency int check (base_frequency between 0 and 7),
  
  -- Calculated weights
  base_weight numeric,
  current_weight numeric,
  
  -- Progress tracking
  percent numeric default 0 check (percent between 0 and 100),
  target_value text,
  current_value text,
  streak int default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(user_id, dependency_id)
);

alter table user_dependencies enable row level security;

create policy "Users can manage own dependencies"
  on user_dependencies for all
  using (user_id in (select id from users where auth.uid() = id));

-- ============================================
-- DEPENDENCY HISTORY
-- ============================================
create table dependency_history (
  id uuid primary key default gen_random_uuid(),
  user_dependency_id uuid references user_dependencies(id) on delete cascade,
  date date not null,
  percent_delta numeric,
  weight_delta numeric,
  reason text,
  created_at timestamptz default now()
);

alter table dependency_history enable row level security;

create policy "Users can view own dependency history"
  on dependency_history for select
  using (user_dependency_id in (
    select id from user_dependencies where user_id in (
      select id from users where auth.uid() = id
    )
  ));

-- ============================================
-- DAILY REPORTS
-- ============================================
create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  
  -- Main goal progress
  goal_progress int check (goal_progress between 0 and 10),
  goal_step_description text,
  
  -- Wellbeing metrics
  mood int check (mood between 1 and 10),
  stress int check (stress between 1 and 10),
  sleep_hours numeric check (sleep_hours between 0 and 24),
  
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(user_id, date)
);

alter table daily_reports enable row level security;

create policy "Users can manage own daily reports"
  on daily_reports for all
  using (user_id in (select id from users where auth.uid() = id));

-- ============================================
-- DAILY DEPENDENCY REPORTS
-- ============================================
create table daily_dependency_reports (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid references daily_reports(id) on delete cascade,
  user_dependency_id uuid references user_dependencies(id) on delete cascade,
  date date not null,
  
  -- Flexible value storage (JSON)
  value jsonb not null,
  
  -- Slip tracking
  slip boolean default false,
  is_win boolean,
  is_partial_win boolean,
  
  created_at timestamptz default now(),
  
  unique(daily_report_id, user_dependency_id)
);

alter table daily_dependency_reports enable row level security;

create policy "Users can manage own dependency reports"
  on daily_dependency_reports for all
  using (daily_report_id in (
    select id from daily_reports where user_id in (
      select id from users where auth.uid() = id
    )
  ));

-- ============================================
-- SYSTEM METRICS (AGGREGATE)
-- ============================================
create table system_metrics (
  user_id uuid primary key references users(id) on delete cascade,
  
  -- O3 - Discipline Health (0-100)
  discipline_health numeric default 50 check (discipline_health between 0 and 100),
  
  -- XP and streaks
  total_xp numeric default 0,
  global_streak int default 0,
  max_global_streak int default 0,
  
  last_report_date date,
  last_update timestamptz default now()
);

alter table system_metrics enable row level security;

create policy "Users can view own metrics"
  on system_metrics for select
  using (user_id in (select id from users where auth.uid() = id));

create policy "System can update metrics"
  on system_metrics for update
  using (true);

-- ============================================
-- DAILY METRICS HISTORY (FOR GRAPHS)
-- ============================================
create table daily_metrics_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  
  discipline_health numeric,
  discipline_delta numeric,
  sum_wins numeric,
  sum_fails numeric,
  xp_earned numeric,
  
  created_at timestamptz default now(),
  
  unique(user_id, date)
);

alter table daily_metrics_history enable row level security;

create policy "Users can view own metrics history"
  on daily_metrics_history for select
  using (user_id in (select id from users where auth.uid() = id));

-- ============================================
-- APP CONFIG
-- ============================================
create table app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- Seed config with C3/O3 coefficients
insert into app_config (key, value, description) values
  ('c3_penalty_coeffs', '{"p3": 1.2, "p7": 0.8, "p30": 0.4}', 'Коэффициенты штрафа для окон памяти'),
  ('c3_reward_coeffs', '{"w3": 1.0, "w7": 0.5, "w30": 0.2}', 'Коэффициенты награды для окон памяти'),
  ('c3_weight_bounds', '{"min": 1.0, "max": 20.0}', 'Границы веса C3'),
  ('o3_health_coeffs', '{"alpha": 0.4, "beta": 0.8}', 'Коэффициенты O3 (победы/провалы)'),
  ('day_score_factors', '{"win": 1.0, "partial_win": 0.5, "fail": 0.6, "critical_fail": 5.0}', 'Факторы вклада дня'),
  ('miss_penalty_factor', '0.3', 'Штраф за пропуск отчёта'),
  ('xp_multipliers', '{"win": 10, "fail": 6}', 'Множители XP');

alter table app_config enable row level security;

create policy "Anyone can view config"
  on app_config for select
  using (true);

-- ============================================
-- INDEXES
-- ============================================
create index idx_users_telegram_id on users(telegram_id);
create index idx_user_dependencies_user_id on user_dependencies(user_id);
create index idx_daily_reports_user_date on daily_reports(user_id, date);
create index idx_daily_dependency_reports_date on daily_dependency_reports(date);
create index idx_dependency_history_user_dep on dependency_history(user_dependency_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_main_goal_updated_at before update on main_goal
  for each row execute function update_updated_at_column();

create trigger update_user_dependencies_updated_at before update on user_dependencies
  for each row execute function update_updated_at_column();

create trigger update_daily_reports_updated_at before update on daily_reports
  for each row execute function update_updated_at_column();

-- Auto-create system_metrics on user creation
create or replace function create_system_metrics_for_user()
returns trigger as $$
begin
  insert into system_metrics (user_id, discipline_health, total_xp)
  values (new.id, 50, 0);
  return new;
end;
$$ language plpgsql;

create trigger on_user_created after insert on users
  for each row execute function create_system_metrics_for_user();

-- Calculate base_weight on user_dependency insert/update
create or replace function calculate_base_weight()
returns trigger as $$
begin
  -- BaseWeight = (BaseHarm * 0.4) + (BaseDifficulty * 0.4) + (BaseFrequency/7 * 10 * 0.2)
  new.base_weight := (new.base_harm * 0.4) + (new.base_difficulty * 0.4) + ((new.base_frequency::numeric / 7.0 * 10.0) * 0.2);
  
  -- Initialize current_weight if not set
  if new.current_weight is null then
    new.current_weight := new.base_weight;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger calculate_user_dependency_base_weight before insert or update on user_dependencies
  for each row execute function calculate_base_weight();

-- ============================================
-- COMMENTS
-- ============================================
comment on table users is 'Пользователи системы (Telegram WebApp)';
comment on table dependencies is 'Каталог доступных зависимостей';
comment on table user_dependencies is 'Зависимости пользователя с параметрами и весами C3';
comment on table daily_reports is 'Ежедневные отчёты пользователя';
comment on table daily_dependency_reports is 'Отчёты по зависимостям за день';
comment on table system_metrics is 'Агрегированные метрики пользователя (O3, XP, streaks)';
comment on table dependency_history is 'История изменений зависимостей для графиков';
comment on table daily_metrics_history is 'История метрик O3 для графиков';
comment on table app_config is 'Конфигурация коэффициентов C3/O3';
