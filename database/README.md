# Database Schema

Структура базы данных для Лень-в-Пень (PostgreSQL / Supabase)

## Таблицы

### users
Основная таблица пользователей (авторизация через Telegram)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| telegram_id | BIGINT | Telegram user ID (уникальный) |
| username | TEXT | Telegram username (@username) |
| first_name | TEXT | Имя из Telegram |
| last_name | TEXT | Фамилия из Telegram |
| photo_url | TEXT | URL фото профиля |
| is_guest | BOOLEAN | Гостевой аккаунт (по умолчанию false) |
| created_at | TIMESTAMP | Дата регистрации |
| last_login | TIMESTAMP | Последний вход |

### profiles
Профили пользователей (дополнительные данные + baseline)

| Поле | Тип | Описание |
|------|-----|----------|
| user_id | UUID | FK → users.id |
| country | TEXT | Страна |
| city | TEXT | Город |
| nickname | TEXT | Никнейм (необязательно) |
| status | ENUM | Статус (full_time, remote, student, part_time, unemployed, other) |
| position | TEXT | Должность |
| baseline | JSONB | Baseline вопросы (активность, стресс, сон и др.) |
| overall_victory_percent | NUMERIC | Общий процент победы (0-100) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### dependency_cards
Карточки зависимостей

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id |
| key | TEXT | Ключ зависимости (smoking, alcohol, phone и т.д.) |
| meta | JSONB | Уточнения (current_amount, target, notes) |
| percent | NUMERIC | Процент победы (0-100) |
| streak | INTEGER | Дни подряд без срыва |
| history | JSONB | История изменений [{date, delta, reason}] |
| priority | INTEGER | Оценка важности (1-10) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### main_goal
Главная цель пользователя

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id |
| text | TEXT | Текст цели |
| category | ENUM | Категория (dependence, life_goal, discipline) |
| progress_estimates | JSONB | Оценки прогресса {date: rating_0_10} |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### daily_reports
Ежедневные отчёты

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id |
| date | DATE | Дата отчёта |
| for_goal | JSONB | Отчёт по главной цели {did_step, step_description, rating} |
| dependencies_daily | JSONB | Отчёт по зависимостям |
| mood | JSONB | Настроение {stress, sleep, energy} |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

## Примеры данных

### baseline (JSONB в profiles)
```json
{
  "phone_hours": "4-6",
  "physical_activity": "2-3x",
  "reading": "10-30min",
  "stress_level": "medium",
  "sleep_quality": "good",
  "water_per_day": "1.5-2L",
  "fresh_air": "several_times_week"
}
```

### meta (JSONB в dependency_cards для курения)
```json
{
  "current_amount": 20,
  "type": "regular",
  "goal": "quit",
  "target": 0
}
```

### history (JSONB в dependency_cards)
```json
[
  {"date": "2025-11-29", "delta": 1.0, "reason": "no_smoke"},
  {"date": "2025-11-28", "delta": 0.5, "reason": "reduced"},
  {"date": "2025-11-27", "delta": -1.0, "reason": "more_than_yesterday"}
]
```

### for_goal (JSONB в daily_reports)
```json
{
  "did_step": true,
  "step_description": "Прочитал статью по профессиональным навыкам",
  "rating": 7
}
```

### dependencies_daily (JSONB в daily_reports)
```json
{
  "smoking": {
    "did_smoke": false,
    "count": 0
  },
  "phone": {
    "hours": 3,
    "top_apps": ["TikTok", "Telegram"]
  },
  "alcohol": {
    "did_drink": false
  }
}
```

## Применение миграций

### Миграция 1: Основные таблицы
```bash
# Через Supabase Dashboard SQL Editor
# Скопировать и выполнить: migration_001_initial.sql
```

### Миграция 2: Роли администраторов
```bash
# Через Supabase Dashboard SQL Editor
# Скопировать и выполнить: migration_002_admin_roles.sql
```

### Через CLI (альтернатива)
```bash
supabase db push

# Или через psql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migration_001_initial.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migration_002_admin_roles.sql
```

## Row Level Security (RLS)

### Политики для обычных пользователей
Все таблицы защищены RLS — пользователи видят только свои данные.

```sql
-- Пример: пользователь видит только свой профиль
CREATE POLICY "Users can select own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);
```

### Политики для администраторов
Администраторы и модераторы имеют расширенный доступ:

```sql
-- Админы видят все профили
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_moderator_or_admin());
```

### Роли
- **admin** — полный доступ ко всем данным
- **moderator** — только просмотр всех данных
- **user** — только свои данные (по умолчанию)

Управление ролями через таблицу `admin_roles`.
