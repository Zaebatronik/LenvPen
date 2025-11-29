-- Лень-в-Пень Database Schema
-- Версия: 1.0
-- Дата: 2025-11-29

-- Удаление существующих таблиц (для чистой миграции)
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS dependency_cards CASCADE;
DROP TABLE IF EXISTS main_goal CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Типы (enums)
CREATE TYPE user_status AS ENUM (
  'full_time',
  'remote',
  'student',
  'part_time',
  'unemployed',
  'other'
);

CREATE TYPE goal_category AS ENUM (
  'dependence',
  'life_goal',
  'discipline'
);

-- ============================================
-- Таблица: users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- Таблица: profiles
-- ============================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  country TEXT,
  city TEXT,
  nickname TEXT,
  status user_status,
  position TEXT,
  baseline JSONB DEFAULT '{}',
  overall_victory_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ============================================
-- Таблица: dependency_cards
-- ============================================
CREATE TABLE dependency_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL, -- smoking, alcohol, phone, etc.
  meta JSONB DEFAULT '{}', -- хранит все уточнения (current_amount, target, notes)
  percent NUMERIC(5,2) DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  streak INTEGER DEFAULT 0,
  history JSONB DEFAULT '[]', -- [{date, delta, reason}]
  priority INTEGER DEFAULT 5, -- 1-10 оценка важности
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Индексы
CREATE INDEX idx_dependency_cards_user_id ON dependency_cards(user_id);
CREATE INDEX idx_dependency_cards_key ON dependency_cards(key);
CREATE INDEX idx_dependency_cards_percent ON dependency_cards(percent);

-- ============================================
-- Таблица: main_goal
-- ============================================
CREATE TABLE main_goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category goal_category DEFAULT 'life_goal',
  progress_estimates JSONB DEFAULT '{}', -- {date: rating_0_10}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Индексы
CREATE INDEX idx_main_goal_user_id ON main_goal(user_id);

-- ============================================
-- Таблица: daily_reports
-- ============================================
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  for_goal JSONB DEFAULT '{}', -- {did_step: bool, step_description: text, rating: 0..10}
  dependencies_daily JSONB DEFAULT '{}', -- {smoking: {did_smoke, count}, phone: {hours}}
  mood JSONB DEFAULT '{}', -- {stress, sleep, energy}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Индексы
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date);
CREATE INDEX idx_daily_reports_user_date ON daily_reports(user_id, date);

-- ============================================
-- Функции и триггеры
-- ============================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dependency_cards_updated_at
  BEFORE UPDATE ON dependency_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_main_goal_updated_at
  BEFORE UPDATE ON main_goal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Политики Row Level Security (RLS)
-- ============================================

-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Политики для users
-- ============================================

-- Пользователь может видеть только свой профиль
CREATE POLICY "Users can select own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Пользователь может обновлять только свой профиль
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- Политики для profiles
-- ============================================

-- Пользователь видит только свой профиль
CREATE POLICY "User sees only own profile"
  ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Пользователь может создать только свой профиль
CREATE POLICY "User inserts only own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Пользователь может обновлять только свой профиль
CREATE POLICY "User updates only own profile"
  ON profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- Политики для dependency_cards
-- ============================================

-- Пользователь видит только свои зависимости
CREATE POLICY "User can see own dependencies"
  ON dependency_cards
  FOR SELECT
  USING (user_id = auth.uid());

-- Пользователь может создавать только свои зависимости
CREATE POLICY "User can insert own dependencies"
  ON dependency_cards
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Пользователь может обновлять только свои зависимости
CREATE POLICY "User can update own dependencies"
  ON dependency_cards
  FOR UPDATE
  USING (user_id = auth.uid());

-- Пользователь может удалять только свои зависимости
CREATE POLICY "User can delete own dependencies"
  ON dependency_cards
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- Политики для main_goal
-- ============================================

-- Пользователь видит только свою цель
CREATE POLICY "User sees only own goal"
  ON main_goal
  FOR SELECT
  USING (user_id = auth.uid());

-- Пользователь может создать только свою цель
CREATE POLICY "User inserts only own goal"
  ON main_goal
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Пользователь может обновлять только свою цель
CREATE POLICY "User updates only own goal"
  ON main_goal
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- Политики для daily_reports
-- ============================================

-- Пользователь видит только свои отчёты
CREATE POLICY "User sees own reports"
  ON daily_reports
  FOR SELECT
  USING (user_id = auth.uid());

-- Пользователь может создавать только свои отчёты
CREATE POLICY "User inserts own reports"
  ON daily_reports
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Пользователь может обновлять только свои отчёты
CREATE POLICY "User updates own reports"
  ON daily_reports
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- Комментарии
-- ============================================

COMMENT ON TABLE users IS 'Пользователи приложения (авторизация через Telegram)';
COMMENT ON TABLE profiles IS 'Профили пользователей с базовыми данными и baseline';
COMMENT ON TABLE dependency_cards IS 'Карточки зависимостей с процентами и историей';
COMMENT ON TABLE main_goal IS 'Главная цель пользователя';
COMMENT ON TABLE daily_reports IS 'Ежедневные отчёты пользователей';

COMMENT ON COLUMN dependency_cards.percent IS 'Процент победы над зависимостью (0-100)';
COMMENT ON COLUMN dependency_cards.streak IS 'Дни подряд без срыва';
COMMENT ON COLUMN dependency_cards.history IS 'История изменений [{date, delta, reason}]';
COMMENT ON COLUMN dependency_cards.priority IS 'Оценка важности 1-10 (задаёт пользователь)';
