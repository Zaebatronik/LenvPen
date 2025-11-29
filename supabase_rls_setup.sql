-- Supabase SQL: Настройка Row Level Security для таблицы users
-- Выполни этот код в Supabase SQL Editor: https://app.supabase.com/project/ypgjlfsoqsejroewzuer/sql

-- 1. Включаем RLS (если еще не включен)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Allow public insert" ON users;
DROP POLICY IF EXISTS "Allow public select" ON users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON users;
DROP POLICY IF EXISTS "Allow users to delete their own data" ON users;

-- 3. Политика INSERT - разрешаем всем создавать новые записи
CREATE POLICY "Allow public insert" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 4. Политика SELECT - разрешаем всем читать данные
CREATE POLICY "Allow public select" ON users
  FOR SELECT
  TO public
  USING (true);

-- 5. Политика UPDATE - разрешаем всем обновлять
CREATE POLICY "Allow public update" ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- 6. Политика DELETE - разрешаем всем удалять
CREATE POLICY "Allow public delete" ON users
  FOR DELETE
  TO public
  USING (true);

-- Готово! Теперь можно работать с таблицей users через anon ключ
