# Инструкция по выполнению миграции C3/O3

## Что сделано:

✅ Создан файл миграции: `database/migrations/002_update_schema_full_c3_o3.sql`
✅ Реализован Worker: `backend/src/workers/dailyReportWorker.js`
✅ Реализованы evaluators: `backend/src/services/dependencyEvaluators.js`
✅ Обновлены API endpoints: `backend/src/routes/dailyReport.js`

## Шаг 1: Выполнить миграцию SQL в Supabase

### Метод 1: Через Web UI (Рекомендуется)

1. Откройте Supabase Dashboard:
   https://supabase.com/dashboard/project/ypgjlfsoqsejroewzuer/sql

2. Нажмите "New Query"

3. Скопируйте всё содержимое файла:
   `D:\MyAPP\LenvPen\database\migrations\002_update_schema_full_c3_o3.sql`

4. Вставьте в редактор и нажмите **"Run"**

5. Проверьте, что выполнение прошло успешно (зелёная галочка)

### Метод 2: Через скрипт проверки

```bash
cd backend
node scripts/runMigration.js
```

Этот скрипт проверит, применена ли миграция, но не выполнит её автоматически.

## Шаг 2: Проверка миграции

После выполнения SQL в Supabase, проверьте:

1. **Добавлены колонки:**
   - `user_dependencies.last_slip_at`
   - `dependency_history.percent_before/after`, `weight_before/after`

2. **Созданы функции:**
   - `get_windows_counts(uuid, date)` - возвращает P3/P7/P30, W3/W7/W30
   - `calculate_current_weight(numeric, jsonb, int, jsonb)` - вычисляет C3

3. **Обновлён app_config:**
   - `coefficients` - все коэффициенты C3/O3
   - `dependency_thresholds` - пороги для evaluators
   - `avatar_stages` - стадии аватара

4. **Созданы индексы:**
   - `idx_daily_dependency_reports_user_dep_date`
   - `idx_dependency_history_date`
   - `idx_daily_metrics_history_user_date`

## Шаг 3: Что дальше?

После миграции нужно:

1. ✅ **Task 3 - COMPLETED**: API endpoints уже обновлены
2. ✅ **Task 4 - COMPLETED**: Worker уже реализован
3. ✅ **Task 5 - COMPLETED**: Evaluators уже созданы
4. ⏳ **Task 2**: Настроить RLS политики (опционально для MVP)
5. ⏳ **Task 6**: Обновить Survey UI с base_harm/difficulty/frequency
6. ⏳ **Task 7**: Создать DailyReport UI компонент
7. ⏳ **Task 8**: Обновить Dashboard с gauge и графиками

## Проверка работы Worker

После миграции можно протестировать Worker:

```javascript
// В Node.js console или через API
const { processDailyReport } = require('./backend/src/workers/dailyReportWorker');

// Сначала создайте отчёт через POST /api/profile/me/daily_report
// Затем проверьте логи Worker в терминале
```

## Структура C3/O3

### C3 - Вычисление веса зависимости

```
CurrentWeight = BaseWeight + Penalty - Reward - StreakFactor
Penalty = P3*1.2 + P7*0.8 + P30*0.4
Reward = W3*1.0 + W7*0.5 + W30*0.2
StreakFactor = log2(streak + 1)
```

### O3 - Дисциплина

```
DisciplineHealth = (SumWins * 0.4) - (SumFails * 0.8)
SumWins = Σ(CurrentWeight * outcome_multiplier) для WIN
SumFails = Σ(CurrentWeight * outcome_multiplier) для FAIL
```

## Troubleshooting

### Ошибка: "function get_windows_counts does not exist"
- Миграция не выполнена. Повторите Шаг 1.

### Ошибка: "column last_slip_at does not exist"
- Часть миграции не применилась. Проверьте логи SQL Editor.

### Worker не запускается
- Проверьте, что backend/config/supabase.js правильно инициализирован
- Убедитесь, что SUPABASE_SERVICE_ROLE_KEY указан в .env

## Что изменилось в API

### Новый формат POST /api/profile/me/daily_report

```json
{
  "goal_progress": 7,
  "mood": 8,
  "stress": 5,
  "sleep_hours": 7.5,
  "comment": "Хороший день",
  "dependencies": [
    {
      "user_dependency_id": "uuid-here",
      "value": {"smoked": 5},
      "slip": false
    }
  ]
}
```

### Новый формат GET /api/profile/me/metrics

```json
{
  "metrics": {
    "discipline_health": 65.3,
    "total_xp": 1250,
    "last_report_date": "2025-01-29",
    "avatar_stage": 3
  },
  "dependencies": [...],
  "history": [...]
}
```
