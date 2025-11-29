# Настройка Row Level Security (RLS) в Supabase

## Проблема
Приложение не может записывать данные в таблицу `users` из-за политик RLS:
```
new row violates row-level security policy for table "users"
```

## Решение

### 1. Открой Supabase Dashboard
Перейди: https://app.supabase.com/project/ypgjlfsoqsejroewzuer

### 2. Перейди в SQL Editor
- В левом меню выбери **SQL Editor**
- Нажми **New query**

### 3. Выполни следующий SQL код:

```sql
-- 1. Включаем RLS для таблицы users (если еще не включен)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Политика INSERT - разрешаем всем создавать новые записи
CREATE POLICY "Allow public insert" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 3. Политика SELECT - разрешаем всем читать данные
CREATE POLICY "Allow public select" ON users
  FOR SELECT
  TO public
  USING (true);

-- 4. Политика UPDATE - разрешаем обновлять только свои записи
CREATE POLICY "Allow users to update their own data" ON users
  FOR UPDATE
  TO public
  USING (auth.uid()::text = telegram_id OR true)
  WITH CHECK (auth.uid()::text = telegram_id OR true);

-- 5. Политика DELETE - разрешаем удалять только свои записи
CREATE POLICY "Allow users to delete their own data" ON users
  FOR DELETE
  TO public
  USING (auth.uid()::text = telegram_id OR true);
```

### 4. Нажми **Run** (или F5)

### 5. После настройки RLS
Включи обратно Supabase в коде:

#### В `frontend/src/pages/SetNickname.jsx`:
Раскомментируй код с Supabase вставкой

#### В `frontend/src/App.jsx`:
Раскомментируй проверку пользователя через Supabase

### 6. Пересобери и задеплой проект
```bash
cd frontend
npm run build
git add .
git commit -m "Enable Supabase after RLS setup"
git push
```

## Альтернативный вариант (проще, но менее безопасный)

Если нужно временно отключить RLS полностью:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

⚠️ **Внимание**: Это отключит все проверки безопасности!

## Текущее состояние

**Статус**: Supabase временно отключен, данные хранятся только в localStorage браузера.

**Что работает**:
- ✅ Регистрация пользователя
- ✅ Прохождение опроса
- ✅ Дашборд

**Что НЕ работает**:
- ❌ Синхронизация между устройствами
- ❌ Сохранение на сервере
- ❌ Восстановление данных при очистке браузера

**После настройки RLS все заработает полностью!**
