# Примеры API запросов для админ-панели

## 🔐 Важно

Все запросы к админ API требуют роль **admin** или **moderator**.

Backend использует `service_role_key` для обхода RLS, но проверяет роль пользователя через функции `is_admin()` / `is_moderator_or_admin()`.

---

## 📊 GET `/api/admin/stats` — Статистика для Dashboard

### Response
```json
{
  "users": {
    "total": 1234,
    "active": 856,
    "inactive": 378,
    "new_today": 12,
    "new_this_week": 89
  },
  "reports": {
    "total": 5678,
    "today": 234,
    "this_week": 1543,
    "avg_per_user": 4.6
  },
  "overall": {
    "avg_victory_percent": 42.5,
    "avg_dependencies_per_user": 2.8
  },
  "top_dependencies": [
    { "key": "phone", "count": 856, "avg_percent": 38.2 },
    { "key": "smoking", "count": 423, "avg_percent": 45.7 },
    { "key": "alcohol", "count": 189, "avg_percent": 52.1 }
  ],
  "registrations_chart": [
    { "date": "2025-11-01", "count": 23 },
    { "date": "2025-11-02", "count": 31 },
    ...
  ]
}
```

### SQL для реализации
```sql
-- Общее количество пользователей
SELECT COUNT(*) as total FROM users;

-- Активные (заполнили отчёт за последние 7 дней)
SELECT COUNT(DISTINCT user_id) 
FROM daily_reports 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Топ зависимостей
SELECT 
  key,
  COUNT(*) as user_count,
  AVG(percent) as avg_percent
FROM dependency_cards
GROUP BY key
ORDER BY user_count DESC
LIMIT 5;
```

---

## 👥 GET `/api/admin/users` — Список пользователей

### Query Parameters
```
?search=username          # Поиск по username/telegram_id
&country=Russia           # Фильтр по стране
&status=full_time         # Фильтр по статусу
&profession=Программист   # Фильтр по профессии
&active=true              # Только активные (отчёт за 7 дней)
&victory_min=0            # Минимальный % победы
&victory_max=100          # Максимальный % победы
&page=1                   # Страница
&limit=50                 # Записей на странице
&sort=created_at          # Сортировка
&order=desc               # Порядок (asc/desc)
```

### Response
```json
{
  "data": [
    {
      "id": "uuid",
      "telegram_id": 123456789,
      "username": "ivanpetrov",
      "first_name": "Иван",
      "last_name": "Петров",
      "photo_url": "https://...",
      "country": "Россия",
      "city": "Москва",
      "status": "full_time",
      "position": "Программист",
      "overall_victory_percent": 42.5,
      "total_dependencies": 3,
      "total_reports": 28,
      "last_report_date": "2025-11-29",
      "created_at": "2025-11-01T12:00:00Z",
      "last_login": "2025-11-29T08:30:00Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "pages": 25
  }
}
```

### SQL
```sql
SELECT 
  u.id,
  u.telegram_id,
  u.username,
  u.first_name,
  u.last_name,
  u.photo_url,
  u.created_at,
  u.last_login,
  p.country,
  p.city,
  p.status,
  p.position,
  p.overall_victory_percent,
  COUNT(DISTINCT dc.id) as total_dependencies,
  COUNT(DISTINCT dr.id) as total_reports,
  MAX(dr.date) as last_report_date
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN dependency_cards dc ON dc.user_id = u.id
LEFT JOIN daily_reports dr ON dr.user_id = u.id
WHERE 
  (u.username ILIKE '%' || :search || '%' OR CAST(u.telegram_id AS TEXT) LIKE '%' || :search || '%')
  AND (:country IS NULL OR p.country = :country)
  AND (:status IS NULL OR p.status = :status)
  AND (:active IS NULL OR dr.date >= CURRENT_DATE - INTERVAL '7 days')
GROUP BY u.id, p.country, p.city, p.status, p.position, p.overall_victory_percent
HAVING 
  (:victory_min IS NULL OR p.overall_victory_percent >= :victory_min)
  AND (:victory_max IS NULL OR p.overall_victory_percent <= :victory_max)
ORDER BY u.created_at DESC
LIMIT :limit OFFSET :offset;
```

---

## 👤 GET `/api/admin/users/[id]` — Детальный профиль

### Response
```json
{
  "user": {
    "id": "uuid",
    "telegram_id": 123456789,
    "username": "ivanpetrov",
    "first_name": "Иван",
    "last_name": "Петров",
    "photo_url": "https://...",
    "created_at": "2025-11-01T12:00:00Z",
    "last_login": "2025-11-29T08:30:00Z"
  },
  "profile": {
    "country": "Россия",
    "city": "Москва",
    "status": "full_time",
    "position": "Программист",
    "overall_victory_percent": 42.5,
    "baseline": {
      "phone_hours": "4-6",
      "physical_activity": "2-3x"
    }
  },
  "main_goal": {
    "text": "Получить повышение до старшего специалиста",
    "category": "life_goal",
    "progress_estimates": {
      "2025-11-01": 5,
      "2025-11-02": 6,
      ...
    },
    "avg_rating": 6.8
  },
  "dependencies": [
    {
      "id": "uuid",
      "key": "smoking",
      "meta": {
        "current_amount": 20,
        "target": 0,
        "goal": "quit"
      },
      "percent": 18.5,
      "streak": 3,
      "priority": 9,
      "history": [
        { "date": "2025-11-29", "delta": 1.0, "reason": "success", "new_percent": 18.5 },
        ...
      ]
    },
    ...
  ],
  "reports": [
    {
      "date": "2025-11-29",
      "for_goal": {
        "did_step": true,
        "step_description": "Прочитал статью",
        "rating": 7
      },
      "dependencies_daily": {
        "smoking": { "did_smoke": false, "count": 0 },
        "phone": { "hours": 3 }
      },
      "mood": {
        "stress": "low",
        "sleep": "good",
        "energy": "normal"
      }
    },
    ...
  ],
  "stats": {
    "total_reports": 28,
    "current_streak": 5,
    "longest_streak": 12,
    "avg_rating": 6.8,
    "most_problematic": "phone",
    "most_successful": "smoking"
  }
}
```

---

## 🎭 GET `/api/admin/dependencies/stats` — Статистика зависимостей

### Response
```json
{
  "dependencies": [
    {
      "key": "phone",
      "icon": "📱",
      "title": "Телефон / Соцсети",
      "users_count": 856,
      "avg_percent": 38.2,
      "avg_streak": 4.5,
      "success_rate": 18.3,
      "distribution": {
        "0-25": 420,
        "25-50": 280,
        "50-75": 120,
        "75-100": 36
      }
    },
    ...
  ],
  "correlations": [
    {
      "dep1": "phone",
      "dep2": "procrastination",
      "correlation": 0.78,
      "users": 345
    },
    ...
  ]
}
```

### SQL
```sql
-- Базовая статистика
SELECT 
  key,
  COUNT(*) as users_count,
  AVG(percent) as avg_percent,
  AVG(streak) as avg_streak,
  COUNT(CASE WHEN percent >= 70 THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM dependency_cards
GROUP BY key
ORDER BY users_count DESC;

-- Корреляции (пары зависимостей)
SELECT 
  dc1.key as dep1,
  dc2.key as dep2,
  COUNT(*) as users
FROM dependency_cards dc1
JOIN dependency_cards dc2 ON dc1.user_id = dc2.user_id AND dc1.key < dc2.key
GROUP BY dc1.key, dc2.key
ORDER BY users DESC
LIMIT 10;
```

---

## 📝 GET `/api/admin/reports` — Список отчётов

### Query Parameters
```
?user_id=uuid             # Фильтр по пользователю
&from=2025-01-01          # От даты
&to=2025-12-31            # До даты
&rating_min=0             # Минимальная оценка
&rating_max=10            # Максимальная оценка
&has_step=true            # Только с шагом к цели
&page=1
&limit=50
```

### Response
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_username": "ivanpetrov",
      "date": "2025-11-29",
      "for_goal": {
        "did_step": true,
        "step_description": "Прочитал статью",
        "rating": 7
      },
      "dependencies_summary": "Smoking: ✅, Phone: 3h",
      "mood": {
        "stress": "low",
        "sleep": "good"
      }
    },
    ...
  ],
  "pagination": { ... }
}
```

---

## 🔐 Роли

### GET `/api/admin/roles` — Список ролей

```json
{
  "roles": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "username": "admin_user",
      "role": "admin",
      "granted_at": "2025-11-01T12:00:00Z",
      "granted_by_username": "superadmin"
    },
    ...
  ]
}
```

### POST `/api/admin/roles` — Назначить роль

**Request:**
```json
{
  "user_id": "uuid",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "role": {
    "id": "uuid",
    "user_id": "uuid",
    "role": "admin",
    "granted_at": "2025-11-29T12:00:00Z"
  }
}
```

### DELETE `/api/admin/roles/[user_id]` — Удалить роль

**Response:**
```json
{
  "success": true,
  "message": "Role removed"
}
```

---

## 💡 Реализация middleware для проверки роли

### Backend (Node.js)
```javascript
// src/middleware/adminAuth.js

export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.id; // Из JWT или сессии
    
    const { data: role } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (!role || role.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
}

export async function requireModeratorOrAdmin(req, res, next) {
  try {
    const userId = req.user?.id;
    
    const { data: role } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (!role || !['admin', 'moderator'].includes(role.role)) {
      return res.status(403).json({ error: 'Moderator or Admin access required' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
}

// Использование
app.get('/api/admin/stats', requireModeratorOrAdmin, async (req, res) => {
  // ...
});

app.post('/api/admin/roles', requireAdmin, async (req, res) => {
  // ...
});
```

---

Эти примеры готовы к использованию при разработке админ-панели! 🚀
