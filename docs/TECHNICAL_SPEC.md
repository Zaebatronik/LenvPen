# Лень-в-Пень - Technical Documentation

## 🎯 Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram WebApp (React)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Onboarding │  │  Dashboard   │  │  Daily Report    │  │
│  │  & Profile  │  │  & Metrics   │  │  Submission      │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API / GraphQL
┌───────────────────────▼─────────────────────────────────────┐
│              Supabase Edge Functions / Node.js              │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  Auth / Profile  │  │  Reports & Dependencies API      │ │
│  └──────────────────┘  └─────────────┬────────────────────┘ │
│                                       │                      │
│  ┌────────────────────────────────────▼──────────────────┐  │
│  │            C3/O3 Worker (Event-driven)               │  │
│  │  • Calculate dynamic weights (C3)                    │  │
│  │  • Update Discipline Health (O3)                     │  │
│  │  • Process daily contributions                       │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  ┌──────────┐ ┌───────────────┐ ┌────────────────────────┐ │
│  │  Users   │ │  Dependencies │ │  Daily Reports         │ │
│  │  Goals   │ │  (C3 weights) │ │  System Metrics (O3)   │ │
│  └──────────┘ └───────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Telegram Bot (Notifications)                    │
│  • Evening reminders                                         │
│  • Streak milestones                                         │
│  • Critical slip alerts                                      │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Формулы и алгоритмы

### C3 - Dynamic Weight Calculation

```javascript
// Базовый вес (из user input)
BaseWeight = (BaseHarm * 0.4) + (BaseDifficulty * 0.4) + ((BaseFrequency/7 * 10) * 0.2)

// Окна памяти
P3, P7, P30 = количество провалов за 3, 7, 30 дней
W3, W7, W30 = количество побед за 3, 7, 30 дней

// Penalty и Reward
Penalty = (P3 * 1.2) + (P7 * 0.8) + (P30 * 0.4)
Reward = (W3 * 1.0) + (W7 * 0.5) + (W30 * 0.2)

// Streak Factor
StreakFactor = log2(Streak + 1)

// Итоговый вес
WeightRaw = BaseWeight + Penalty - Reward - StreakFactor
CurrentWeight = clamp(WeightRaw, 1.0, 20.0)
```

### O3 - Discipline Health (0-100)

```javascript
// За день
SumWins = Σ(CurrentWeight_i * WinIndicator_i)
SumFails = Σ(CurrentWeight_i * FailIndicator_i)

// WinIndicator: 1.0 (full), 0.5 (partial), 0 (fail)
// FailIndicator: 1.0 (fail), >1.5 (critical slip)

DeltaHealth = (SumWins * alpha) - (SumFails * beta)
// alpha = 0.4, beta = 0.8

DisciplineHealth_new = clamp(DisciplineHealth_old + DeltaHealth, 0, 100)
```

### Day Contribution per Dependency

```javascript
if (full_win) {
  delta_percent = +(CurrentWeight / 100) * WinFactor * Scale
}
if (partial_win) {
  delta_percent = +(CurrentWeight / 100) * (WinFactor * 0.5) * Scale
}
if (fail) {
  delta_percent = -(CurrentWeight / 100) * FailFactor * Scale
}
if (critical_slip) {
  delta_percent = -(CurrentWeight / 100) * CriticalFailFactor * Scale
}

Percent_new = clamp(Percent_old + delta_percent, 0, 100)
```

## 🔐 Security & RLS

### Row Level Security Policies

```sql
-- Users can only see their own data
create policy "Users can view own data"
  on users for select
  using (auth.uid() = id);

-- Dependencies and Reports
create policy "Users can manage own dependencies"
  on user_dependencies for all
  using (user_id in (select id from users where auth.uid() = id));

-- Admin access via service_role key (server-side only)
```

### Authentication Flow

```
1. User opens Telegram WebApp
2. Frontend получает initData from Telegram SDK
3. POST /api/auth/telegram with initData
4. Backend validates signature (crypto.createHmac)
5. Upsert user to database
6. Return JWT token (or Supabase session)
7. Frontend stores token, includes in all requests
```

## 📁 Project Structure

```
LenvPen/
├── frontend/               # React + Vite Telegram WebApp
│   ├── src/
│   │   ├── pages/          # Screens
│   │   │   ├── onboarding/
│   │   │   │   ├── Welcome.jsx
│   │   │   │   ├── SelectCountry.jsx
│   │   │   │   ├── SelectCity.jsx
│   │   │   │   ├── SelectDependencies.jsx  # NEW
│   │   │   │   ├── DependencyParams.jsx    # NEW
│   │   │   │   ├── SetMainGoal.jsx         # NEW
│   │   │   │   └── SetNickname.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.jsx           # REDESIGN
│   │   │   │   ├── DependencyDetail.jsx    # NEW
│   │   │   │   └── MainGoalDetail.jsx      # NEW
│   │   │   └── reports/
│   │   │       ├── DailyReport.jsx         # REDESIGN
│   │   │       └── ReportResult.jsx        # NEW
│   │   ├── components/
│   │   │   ├── DependencyCard.jsx          # NEW
│   │   │   ├── DisciplineGauge.jsx         # NEW
│   │   │   ├── ProgressChart.jsx           # NEW
│   │   │   └── Sparkline.jsx               # NEW
│   │   ├── services/
│   │   │   ├── supabase.js                 # NEW
│   │   │   └── api.js                      # REDESIGN
│   │   ├── data/
│   │   │   └── locations.js
│   │   └── App.jsx
│   └── package.json
├── backend/                # Node.js / Supabase Edge Functions
│   ├── functions/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── dependencies.js
│   │   ├── daily-report.js
│   │   └── metrics.js
│   ├── workers/
│   │   └── c3-worker.js    # ✅ CREATED
│   └── package.json
├── database/
│   ├── schema.sql          # ✅ CREATED
│   ├── migrations/
│   └── seeds/
│       └── dependencies.sql
├── bot/
│   ├── index.js            # Telegram bot (notifications)
│   └── .env
├── docs/
│   ├── IMPLEMENTATION_PLAN.md  # ✅ CREATED
│   ├── TECHNICAL_SPEC.md       # ✅ CREATED (this file)
│   └── API.md                  # TODO
└── README.md
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Telegram Bot Token

### Environment Variables

```env
# Backend (.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
TELEGRAM_BOT_TOKEN=xxx
JWT_SECRET=xxx

# Bot (.env)
TELEGRAM_BOT_TOKEN=xxx
WEBAPP_URL=https://lenvpen.pages.dev

# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Installation

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (если используется Node.js)
cd backend
npm install
npm run dev

# Bot
cd bot
npm install
npm start
```

### Database Setup

```bash
# 1. Create Supabase project
# 2. Run migrations
psql -h xxx.supabase.co -U postgres < database/schema.sql

# 3. Seed dependencies
psql -h xxx.supabase.co -U postgres < database/seeds/dependencies.sql
```

## 📡 API Endpoints

See [API.md](./API.md) for full documentation.

Quick reference:
- `POST /api/auth/telegram` - Auth
- `GET /api/profile/me` - Profile + dependencies + metrics
- `POST /api/profile/me/daily_report` - Submit daily report (triggers worker)
- `GET /api/profile/me/metrics` - Discipline health, XP, streaks
- `GET /api/profile/me/dependency/{id}/history` - Time series data

## 🧪 Testing

```bash
# Unit tests (формулы C3/O3)
npm run test:unit

# Integration tests (API)
npm run test:integration

# E2E tests (critical flows)
npm run test:e2e
```

## 🚀 Deployment

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run build
# Auto-deploy via GitHub integration
```

### Backend (Supabase Edge Functions)
```bash
supabase functions deploy auth
supabase functions deploy daily-report
# etc.
```

### Bot (любой Node.js хостинг)
```bash
cd bot
npm start
# Keep alive with PM2 or Docker
```

## 📈 Monitoring

- Supabase Dashboard: Database metrics, RLS errors
- Sentry/LogRocket: Frontend errors
- Cloudflare Analytics: Traffic
- Bot health: webhook status

## 🔧 Configuration

All C3/O3 coefficients stored in `app_config` table and can be adjusted without code changes:

```sql
-- Example: adjust O3 sensitivity
update app_config 
set value = '{"alpha": 0.5, "beta": 0.7}'
where key = 'o3_health_coeffs';
```

## 📝 Notes

- All dates in UTC, display in user's timezone
- Daily report deadline: 03:00 (next day)
- Worker runs async via queue/trigger
- RLS enforced on all user data
- Admin uses service_role key only on server

---

**Version:** 1.0  
**Last Updated:** 2025-11-29  
**Author:** Development Team
