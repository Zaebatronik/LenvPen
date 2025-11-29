# План реализации "Лень-в-Пень" MVP+

## Этап 1: Инфраструктура и БД ✅
- [x] Создана полная схема БД (schema.sql)
- [ ] Настроить Supabase проект
- [ ] Выполнить миграции
- [ ] Настроить RLS политики
- [ ] Создать Edge Functions для worker

## Этап 2: Backend API (Node.js/Supabase Edge Functions)
### 2.1 Авторизация
- [ ] POST /api/auth/telegram - проверка initData, создание JWT
- [ ] Middleware для проверки токенов

### 2.2 Profile API
- [ ] GET /api/profile/me - профиль + цель + зависимости + метрики
- [ ] POST /api/profile/me - обновление профиля
- [ ] POST /api/profile/me/main_goal - установка цели
- [ ] GET /api/profile/me/main_goal

### 2.3 Dependencies API
- [ ] GET /api/dependencies - список доступных зависимостей
- [ ] POST /api/profile/me/dependencies - создание user_dependencies
- [ ] GET /api/profile/me/dependencies - список с progress

### 2.4 Daily Reports API
- [ ] POST /api/profile/me/daily_report - отправка отчёта + trigger worker
- [ ] GET /api/profile/me/daily_report?date=YYYY-MM-DD
- [ ] GET /api/profile/me/reports?from=...&to=...

### 2.5 Metrics & History API
- [ ] GET /api/profile/me/metrics - discipline_health, XP, streaks
- [ ] GET /api/profile/me/dependency/{id}/history?days=30
- [ ] GET /api/profile/me/discipline_history?days=30

## Этап 3: Worker - Расчёт C3/O3
### 3.1 Core алгоритм
- [ ] Функция calculate_c3_weight(user_dependency_id, date)
  - [ ] Подсчёт P3/P7/P30 (провалы)
  - [ ] Подсчёт W3/W7/W30 (победы)
  - [ ] Расчёт Penalty/Reward
  - [ ] Расчёт StreakFactor
  - [ ] Формула WeightRaw + clamp(1, 20)
  - [ ] Обновление current_weight

### 3.2 Day contribution
- [ ] Функция calculate_day_contribution(daily_report_id)
  - [ ] Определение win/partial_win/fail по каждой зависимости
  - [ ] Расчёт delta_percent
  - [ ] Обновление percent (0-100)
  - [ ] Запись в dependency_history

### 3.3 Discipline Health (O3)
- [ ] Функция calculate_discipline_health(user_id, date)
  - [ ] Расчёт SumWins/SumFails за день
  - [ ] DeltaHealth = alpha*SumWins - beta*SumFails
  - [ ] Обновление discipline_health (0-100)
  - [ ] Запись в daily_metrics_history

### 3.4 Streaks
- [ ] Обновление streak per dependency
- [ ] Обновление global_streak
- [ ] Проверка пропуска отчёта (MissPenalty)

### 3.5 Integration
- [ ] process_daily_report(report_id) - главная функция worker
- [ ] Транзакционность всех операций
- [ ] Обработка edge cases

## Этап 4: Frontend - Онбординг (переделка)
### 4.1 Страницы онбординга
- [ ] Welcome (существует) - обновить текст
- [ ] SelectCountry (существует) - оставить
- [ ] SelectCity (существует) - оставить
- [ ] SetNickname (существует) - оставить
- [ ] NEW: SelectDependencies - выбор зависимостей (multi-select)
- [ ] NEW: DependencyParams - для каждой: harm, difficulty, frequency, target
- [ ] NEW: SetMainGoal - ввод главной цели
- [ ] NEW: FirstReport - первый ежедневный отчёт

### 4.2 Обновление роутинга
- [ ] Добавить новые маршруты в App.jsx
- [ ] Сохранение прогресса онбординга в localStorage/state

## Этап 5: Frontend - Dashboard
### 5.1 Главный экран
- [ ] Header: avatar, username, discipline_health badge
- [ ] Центр: большой аватар + эволюция
- [ ] Main Goal card с progress
- [ ] Dependencies carousel/grid
  - [ ] Карточка: name, percent, sparkline, current_weight, streak
- [ ] Today summary
- [ ] Overall Victory bar (O3 gauge 0-100)
- [ ] Footer navigation

### 5.2 Dependency Detail
- [ ] График percent (30 дней)
- [ ] График weight (30 дней)
- [ ] История срывов
- [ ] Quick actions

### 5.3 Main Goal Detail
- [ ] Текст цели
- [ ] График progress (7/30 дней)
- [ ] Связь с зависимостями (% влияние)

## Этап 6: Frontend - Daily Report
### 6.1 Форма отчёта
- [ ] Выбор даты (editable до 03:00)
- [ ] Для каждой зависимости: input (type зависит от dep)
  - [ ] smoking: number (sigarettes)
  - [ ] phone: hours
  - [ ] alcohol: drinks
  - [ ] и т.д.
- [ ] Main goal: did step? + description + rating (0-10)
- [ ] Mood/Stress/Sleep
- [ ] Comment
- [ ] Submit button

### 6.2 Result screen
- [ ] Список изменений dependencies (delta percent)
- [ ] DisciplineHealth delta
- [ ] Мотивационный текст
- [ ] Предупреждения при critical slip

## Этап 7: Графики и визуализация
- [ ] Библиотека: recharts или chart.js
- [ ] Dependency percent chart (line, 30/90 days)
- [ ] Weight chart (dual axis: weight + percent)
- [ ] DisciplineHealth gauge + history
- [ ] Daily timeline (stacked bars SumWins/SumFails)
- [ ] Sparklines на карточках (7 дней)

## Этап 8: Telegram Bot - Notifications
- [ ] Вечернее напоминание (21:00 local)
- [ ] Streak milestone notifications
- [ ] Critical slip alerts
- [ ] Настройка времени напоминаний

## Этап 9: Testing & Calibration
- [ ] Unit-тесты формул C3/O3
- [ ] Integration тесты API
- [ ] E2E тесты critical flows
- [ ] Closed beta (10 пользователей)
- [ ] Калибровка коэффициентов на реальных данных

## Этап 10: Admin & Security
- [ ] Admin endpoints (service_role)
- [ ] CSV export данных
- [ ] Удаление аккаунта
- [ ] Audit logs
- [ ] Rate limiting
- [ ] Мониторинг ошибок

## Этап 11: Polishing & Launch
- [ ] i18n (русский + английский)
- [ ] Анимации и transitions
- [ ] Loading states
- [ ] Error handling UI
- [ ] Onboarding tips
- [ ] Help/FAQ section
- [ ] Privacy policy & Terms
- [ ] Analytics (optional)

---

## Текущий статус
**Версия:** 0.0.8
**Завершено:** Базовая регистрация (страна, город, никнейм)
**Следующий шаг:** Этап 1 - Настройка Supabase

## Приоритетность
1. **Critical:** Этапы 1-3 (БД + Backend + Worker)
2. **High:** Этапы 4-6 (Онбординг + Dashboard + Reports)
3. **Medium:** Этапы 7-8 (Графики + Notifications)
4. **Low:** Этапы 9-11 (Testing + Admin + Polish)

## Estimate
- **MVP функциональность:** 3-4 недели
- **Полный MVP+:** 6-8 недель
- **Beta-ready:** 10-12 недель
