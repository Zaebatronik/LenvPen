-- Migration: Full C3/O3 Implementation
-- Date: 2025-11-29
-- Description: Add missing fields and update config for complete C3/O3 system

-- ============================================
-- ADD MISSING FIELDS TO user_dependencies
-- ============================================
alter table user_dependencies
  add column if not exists last_slip_at timestamptz;

-- Add percent/weight history fields
alter table dependency_history
  add column if not exists percent_before numeric,
  add column if not exists percent_after numeric,
  add column if not exists weight_before numeric,
  add column if not exists weight_after numeric;

-- Update existing percent_delta / weight_delta columns to be computed
alter table dependency_history
  alter column percent_delta drop not null,
  alter column weight_delta drop not null;

-- ============================================
-- UPDATE daily_dependency_reports
-- ============================================
alter table daily_dependency_reports
  add column if not exists note text;

-- ============================================
-- UPDATE app_config WITH FULL COEFFICIENTS
-- ============================================

-- Delete old config entries to recreate with new structure
delete from app_config where key like 'c3_%' or key like 'o3_%' or key like '%_factor%';

-- Insert comprehensive config matching spec
insert into app_config (key, value, description) values
('coefficients', 
  '{
    "penalty_weights": {"p3": 1.2, "p7": 0.8, "p30": 0.4},
    "reward_weights": {"w3": 1.0, "w7": 0.5, "w30": 0.2},
    "alpha": 0.4,
    "beta": 0.8,
    "win_factor": 10,
    "partial_win_factor": 5,
    "fail_factor": 6,
    "critical_fail_factor": 20,
    "miss_penalty_factor": 0.3,
    "streak_bonus_7": 2.0,
    "streak_bonus_30": 5.0
  }'::jsonb,
  'Все коэффициенты C3/O3 в одном объекте'
) on conflict (key) do update set value = excluded.value;

-- Dependency-specific thresholds
insert into app_config (key, value, description) values
('dependency_thresholds', 
  '{
    "smoking": {"critical_threshold": 20},
    "phone": {"target_hours": 3, "critical_hours": 12},
    "alcohol": {"heavy_threshold": 5},
    "drugs": {"any_positive_critical": true}
  }'::jsonb,
  'Пороги для оценки исходов по типам зависимостей'
) on conflict (key) do update set value = excluded.value;

-- Avatar/stage config
insert into app_config (key, value, description) values
('avatar_stages', 
  '[
    {"min": 0, "max": 19, "stage": 0, "desc": "ленивец лёжа"},
    {"min": 20, "max": 39, "stage": 1, "desc": "ленивец пытается встать"},
    {"min": 40, "max": 59, "stage": 2, "desc": "ленивец стоящий"},
    {"min": 60, "max": 79, "stage": 3, "desc": "грозный ленивец"},
    {"min": 80, "max": 100, "stage": 4, "desc": "уверенный человек"}
  ]'::jsonb,
  'Стадии аватара в зависимости от discipline_health'
) on conflict (key) do update set value = excluded.value;

-- ============================================
-- CREATE FUNCTION: Get Windows Counts
-- ============================================
create or replace function get_windows_counts(
  p_user_dependency_id uuid,
  p_date date
)
returns jsonb as $$
declare
  result jsonb;
begin
  with window_data as (
    select
      -- P3: fails in last 3 days
      count(*) filter (
        where date >= p_date - interval '2 days' 
        and date <= p_date
        and (is_win = false or slip = true)
      ) as p3,
      -- P7: fails in last 7 days
      count(*) filter (
        where date >= p_date - interval '6 days' 
        and date <= p_date
        and (is_win = false or slip = true)
      ) as p7,
      -- P30: fails in last 30 days
      count(*) filter (
        where date >= p_date - interval '29 days' 
        and date <= p_date
        and (is_win = false or slip = true)
      ) as p30,
      -- W3: wins in last 3 days
      count(*) filter (
        where date >= p_date - interval '2 days' 
        and date <= p_date
        and is_win = true
        and is_partial_win = false
      ) as w3,
      -- W7: wins in last 7 days
      count(*) filter (
        where date >= p_date - interval '6 days' 
        and date <= p_date
        and is_win = true
        and is_partial_win = false
      ) as w7,
      -- W30: wins in last 30 days
      count(*) filter (
        where date >= p_date - interval '29 days' 
        and date <= p_date
        and is_win = true
        and is_partial_win = false
      ) as w30
    from daily_dependency_reports
    where user_dependency_id = p_user_dependency_id
  )
  select jsonb_build_object(
    'P3', p3,
    'P7', p7,
    'P30', p30,
    'W3', w3,
    'W7', w7,
    'W30', w30
  ) into result
  from window_data;
  
  return coalesce(result, '{"P3":0,"P7":0,"P30":0,"W3":0,"W7":0,"W30":0}'::jsonb);
end;
$$ language plpgsql stable;

-- ============================================
-- CREATE FUNCTION: Calculate Current Weight
-- ============================================
create or replace function calculate_current_weight(
  p_base_weight numeric,
  p_windows jsonb,
  p_streak int,
  p_coeffs jsonb
)
returns numeric as $$
declare
  penalty numeric;
  reward numeric;
  streak_factor numeric;
  weight_raw numeric;
  result numeric;
begin
  -- Calculate Penalty
  penalty := (p_windows->>'P3')::numeric * (p_coeffs->'penalty_weights'->>'p3')::numeric
           + (p_windows->>'P7')::numeric * (p_coeffs->'penalty_weights'->>'p7')::numeric
           + (p_windows->>'P30')::numeric * (p_coeffs->'penalty_weights'->>'p30')::numeric;
  
  -- Calculate Reward
  reward := (p_windows->>'W3')::numeric * (p_coeffs->'reward_weights'->>'w3')::numeric
          + (p_windows->>'W7')::numeric * (p_coeffs->'reward_weights'->>'w7')::numeric
          + (p_windows->>'W30')::numeric * (p_coeffs->'reward_weights'->>'w30')::numeric;
  
  -- Streak Factor = log2(streak + 1)
  streak_factor := case 
    when p_streak > 0 then log(2, p_streak + 1)
    else 0
  end;
  
  -- Raw Weight
  weight_raw := p_base_weight + penalty - reward - streak_factor;
  
  -- Clamp to [1, 20]
  result := greatest(1.0, least(20.0, weight_raw));
  
  return result;
end;
$$ language plpgsql immutable;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_daily_dependency_reports_user_dep_date 
  on daily_dependency_reports(user_dependency_id, date desc);

create index if not exists idx_dependency_history_date 
  on dependency_history(date desc);

create index if not exists idx_daily_metrics_history_user_date 
  on daily_metrics_history(user_id, date desc);

-- ============================================
-- COMMENTS
-- ============================================
comment on function get_windows_counts is 'Подсчитывает P3/P7/P30 и W3/W7/W30 для зависимости';
comment on function calculate_current_weight is 'Вычисляет текущий вес C3 на основе окон и стрика';
comment on column user_dependencies.last_slip_at is 'Время последнего срыва';
comment on column dependency_history.percent_before is 'Процент до изменения';
comment on column dependency_history.percent_after is 'Процент после изменения';

