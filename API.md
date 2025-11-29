# API Документация

## Базовый URL
```
http://localhost:3000/api
```

---

## 🔐 Авторизация

### POST `/auth/telegram`
Авторизация через Telegram WebApp

**Request Body:**
```json
{
  "initData": "string (от Telegram WebApp)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "telegram_id": 123456789,
    "username": "username",
    "first_name": "Имя",
    "last_name": "Фамилия",
    "photo_url": "https://..."
  },
  "has_profile": false,
  "profile": null
}
```

---

## 👤 Профиль

### GET `/profile/:userId`
Получить полный профиль пользователя

**Response:**
```json
{
  "profile": {
    "user_id": "uuid",
    "country": "Россия",
    "city": "Москва",
    "status": "full_time",
    "position": "Программист",
    "overall_victory_percent": 42.5,
    "baseline": {}
  },
  "dependencies": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "key": "smoking",
      "meta": {},
      "percent": 18.0,
      "streak": 3,
      "history": [],
      "priority": 8
    }
  ],
  "main_goal": {
    "id": "uuid",
    "user_id": "uuid",
    "text": "Получить повышение",
    "category": "life_goal",
    "progress_estimates": {}
  },
  "recent_reports": []
}
```

### POST `/profile/:userId/baseline`
Сохранить baseline данные (анкета)

**Request Body:**
```json
{
  "country": "Россия",
  "city": "Москва",
  "nickname": "nick123",
  "status": "full_time",
  "position": "Программист",
  "baseline": {
    "phone_hours": "4-6",
    "physical_activity": "2-3x",
    "stress_level": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "profile": { ... }
}
```

### POST `/profile/:userId/dependency`
Создать/обновить зависимость

**Request Body:**
```json
{
  "key": "smoking",
  "meta": {
    "current_amount": 20,
    "type": "regular",
    "goal": "quit",
    "target": 0
  },
  "priority": 8
}
```

**Response:**
```json
{
  "success": true,
  "dependency": {
    "id": "uuid",
    "key": "smoking",
    "percent": 0,
    "streak": 0,
    ...
  }
}
```

### POST `/profile/:userId/main-goal`
Сохранить главную цель

**Request Body:**
```json
{
  "text": "Получить повышение до старшего специалиста",
  "category": "life_goal"
}
```

**Response:**
```json
{
  "success": true,
  "goal": {
    "id": "uuid",
    "text": "...",
    "category": "life_goal",
    "progress_estimates": {}
  }
}
```

### GET `/profile/:userId/stats`
Получить статистику

**Response:**
```json
{
  "overall_victory_percent": 42,
  "dependencies": [ ... ],
  "reports": [ ... ],
  "total_reports": 15
}
```

---

## 📝 Дневные отчёты

### POST `/daily-report`
Создать/обновить дневной отчёт

**Request Body:**
```json
{
  "userId": "uuid",
  "date": "2025-11-29",
  "for_goal": {
    "did_step": true,
    "step_description": "Прочитал статью",
    "rating": 7
  },
  "dependencies_daily": {
    "smoking": {
      "did_smoke": false,
      "count": 0
    },
    "phone": {
      "hours": 3,
      "top_apps": ["TikTok", "Telegram"]
    }
  },
  "mood": {
    "stress": "low",
    "sleep": "good",
    "energy": "normal"
  }
}
```

**Response:**
```json
{
  "success": true,
  "report": { ... },
  "updates": [
    {
      "id": "dep_uuid",
      "percent": 19.0,
      "streak": 4,
      "history": [ ... ]
    }
  ]
}
```

### GET `/daily-report/:userId/:date`
Получить отчёт за дату

**Response:**
```json
{
  "report": {
    "id": "uuid",
    "user_id": "uuid",
    "date": "2025-11-29",
    "for_goal": { ... },
    "dependencies_daily": { ... },
    "mood": { ... }
  }
}
```

### GET `/daily-report/:userId/latest`
Получить последний отчёт

**Response:**
```json
{
  "report": { ... }
}
```

### GET `/daily-report/:userId/check-today`
Проверить, заполнен ли отчёт сегодня

**Response:**
```json
{
  "has_report_today": true,
  "report": { ... },
  "date": "2025-11-29"
}
```

---

## 📊 Коды ответов

- `200` — Успех
- `400` — Неверный запрос
- `401` — Не авторизован
- `404` — Не найдено
- `500` — Ошибка сервера

---

## 🔧 Примеры использования

### JavaScript (axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Авторизация
const auth = await api.post('/auth/telegram', {
  initData: WebApp.initData
});

// Получить профиль
const profile = await api.get(`/profile/${userId}`);

// Сохранить отчёт
const report = await api.post('/daily-report', {
  userId,
  date: '2025-11-29',
  for_goal: { did_step: true, rating: 8 },
  dependencies_daily: { smoking: { did_smoke: false } }
});
```

---

## 🔒 Безопасность

- Все запросы к `/auth/telegram` проверяют подпись Telegram
- Row Level Security (RLS) в Supabase защищает данные пользователей
- Service Role Key используется только на backend
- CORS настроен для WebApp URL

---

## 📝 Примечания

- Все даты в формате `YYYY-MM-DD`
- Проценты хранятся как NUMERIC(5,2) (0.00 - 100.00)
- JSONB поля позволяют гибкую структуру данных
- История изменений сохраняется в `dependency_cards.history`
