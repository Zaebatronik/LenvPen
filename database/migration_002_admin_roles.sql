-- Миграция для таблицы ролей администраторов
-- Применять после migration_001_initial.sql

-- ============================================
-- Таблица: admin_roles
-- ============================================

CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  UNIQUE(user_id)
);

-- Индексы
CREATE INDEX idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX idx_admin_roles_role ON admin_roles(role);

-- Комментарии
COMMENT ON TABLE admin_roles IS 'Роли администраторов (admin - полный доступ, moderator - только просмотр)';
COMMENT ON COLUMN admin_roles.role IS 'admin - полный доступ, moderator - только просмотр';

-- ============================================
-- Функция проверки, является ли пользователь админом
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Функция проверки, является ли пользователь модератором или админом
-- ============================================

CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS для admin_roles
-- ============================================

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Только админы могут видеть роли
CREATE POLICY "Only admins can view roles"
  ON admin_roles
  FOR SELECT
  USING (is_moderator_or_admin());

-- Только админы могут назначать роли
CREATE POLICY "Only admins can insert roles"
  ON admin_roles
  FOR INSERT
  WITH CHECK (is_admin());

-- Только админы могут удалять роли
CREATE POLICY "Only admins can delete roles"
  ON admin_roles
  FOR DELETE
  USING (is_admin());

-- ============================================
-- Расширенные политики для админов
-- ============================================

-- Админы могут видеть всех пользователей
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (is_moderator_or_admin());

-- Админы могут видеть все профили
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_moderator_or_admin());

-- Админы могут видеть все зависимости
CREATE POLICY "Admins can view all dependencies"
  ON dependency_cards
  FOR SELECT
  USING (is_moderator_or_admin());

-- Админы могут видеть все цели
CREATE POLICY "Admins can view all goals"
  ON main_goal
  FOR SELECT
  USING (is_moderator_or_admin());

-- Админы могут видеть все отчёты
CREATE POLICY "Admins can view all reports"
  ON daily_reports
  FOR SELECT
  USING (is_moderator_or_admin());

-- ============================================
-- View для админ-статистики
-- ============================================

CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.telegram_id,
  u.username,
  u.first_name,
  u.created_at,
  u.last_login,
  p.country,
  p.city,
  p.status,
  p.position,
  p.overall_victory_percent,
  COUNT(DISTINCT dc.id) as total_dependencies,
  COUNT(DISTINCT dr.id) as total_reports,
  MAX(dr.date) as last_report_date,
  (SELECT text FROM main_goal WHERE user_id = u.id LIMIT 1) as main_goal_text
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN dependency_cards dc ON dc.user_id = u.id
LEFT JOIN daily_reports dr ON dr.user_id = u.id
GROUP BY u.id, p.country, p.city, p.status, p.position, p.overall_victory_percent;

-- RLS для view
ALTER VIEW admin_user_stats SET (security_invoker = on);

COMMENT ON VIEW admin_user_stats IS 'Сводная статистика пользователей для админ-панели';
