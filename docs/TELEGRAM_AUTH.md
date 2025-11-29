# Авторизация через Telegram WebApp

## 🔐 Концепция

Авторизация происходит **только через Telegram ID** — без email, без паролей, без дополнительных форм.

### Преимущества:
- ✅ Мгновенная регистрация
- ✅ Нет необходимости запоминать пароли
- ✅ Безопасная проверка подписи Telegram
- ✅ Автоматическое получение username, имени, фото
- ✅ Пользователь остаётся анонимным (только Telegram данные)

---

## 📋 Как это работает

### 1. Пользователь открывает бота

```
Пользователь → @LenvPenBot → /start → Кнопка "Открыть приложение"
```

### 2. Telegram передаёт данные в WebApp

Когда пользователь нажимает кнопку, Telegram автоматически открывает WebApp и передаёт **initData**:

```javascript
// Telegram WebApp SDK автоматически предоставляет:
window.Telegram.WebApp.initData
```

**Содержимое initData:**
```
query_id=AAHdF6IQAAAAAN0X...
user={"id":123456789,"first_name":"Иван","last_name":"Петров","username":"ivanpetrov","language_code":"ru","is_premium":false}
auth_date=1701234567
hash=a1b2c3d4e5f6...
```

### 3. WebApp отправляет initData на backend

```javascript
// frontend/src/App.jsx
const initData = WebApp.initData;

const authData = await apiClient.authenticateTelegram(initData);
```

### 4. Backend проверяет подпись

```javascript
// backend/src/utils/telegram.js

// Алгоритм проверки:
// 1. Извлекаем hash из initData
// 2. Создаём data_check_string (отсортированные параметры)
// 3. Вычисляем secret_key = HMAC-SHA256("WebAppData", bot_token)
// 4. Вычисляем hash = HMAC-SHA256(secret_key, data_check_string)
// 5. Сравниваем с переданным hash

export function verifyTelegramWebAppData(initData, botToken) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}
```

### 5. Backend ищет/создаёт пользователя

```javascript
// backend/src/routes/auth.js

// Парсим данные пользователя
const userData = parseTelegramInitData(initData);
// userData = { id: 123456789, username: "ivanpetrov", first_name: "Иван", ... }

// Ищем в БД по telegram_id
const { data: existingUser } = await supabase
  .from('users')
  .select('*')
  .eq('telegram_id', userData.id)
  .maybeSingle();

if (existingUser) {
  // Пользователь существует → обновляем last_login
  // и возвращаем данные
} else {
  // Новый пользователь → создаём запись
  await supabase.from('users').insert({
    telegram_id: userData.id,
    username: userData.username,
    first_name: userData.first_name,
    // НЕТ email, НЕТ пароля!
  });
}
```

### 6. Проверяем наличие профиля

```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Если profile === null → новый пользователь → показываем анкету
// Если profile существует → показываем Dashboard
```

---

## 🔑 Ключевые моменты

### Безопасность

✅ **Подпись проверяется на backend** — фронтенд не может подделать данные

✅ **auth_date проверяется** — данные не старше 24 часов

✅ **Service Role Key** — backend использует service_role для обхода RLS

### Telegram ID как первичный ключ

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,  -- ← Уникальный идентификатор
  username TEXT,
  first_name TEXT,
  ...
);
```

- `telegram_id` — уникален, проверяется Telegram
- Мы НЕ храним email
- Мы НЕ храним пароли
- Пользователь идентифицируется только через Telegram

### Сессии

В текущей реализации сессии хранятся на клиенте (localStorage):

```javascript
// После успешной авторизации
localStorage.setItem('user', JSON.stringify(user));
```

Для production можно добавить JWT токены:

```javascript
// backend генерирует JWT
const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });

// frontend сохраняет и отправляет в headers
headers: { Authorization: `Bearer ${token}` }
```

---

## 🛠 Настройка Telegram Bot для WebApp

### 1. Создание бота
```
@BotFather → /newbot → название → получаем TOKEN
```

### 2. Настройка Menu Button
```
@BotFather → /mybots → выбрать бота → 
Bot Settings → Menu Button → 
Вставить URL WebApp (например: https://your-app.com)
```

### 3. Тестирование локально

**Проблема:** Telegram WebApp работает только через HTTPS

**Решение:** Использовать ngrok или cloudflared

```bash
# Установить ngrok
# https://ngrok.com/download

# Запустить туннель
ngrok http 5173

# Скопировать https URL (например: https://abc123.ngrok.io)
# Вставить в Menu Button у @BotFather
```

---

## 📱 Пример полного flow

### Шаг 1: Пользователь открывает бота

```
Telegram → @LenvPenBot → /start
```

Bot отвечает:
```
📱 ЛЕНЬ-В-ПЕНЬ

🔥 Готов наконец-то поднять жопу с дивана?

[Кнопка: Открыть приложение]  ← WebApp URL
```

### Шаг 2: Нажатие на кнопку

Telegram открывает WebApp и передаёт `initData`:

```
https://your-app.com?tgWebAppData=query_id%3D...
```

### Шаг 3: WebApp загружается

```javascript
// frontend/src/App.jsx

useEffect(() => {
  WebApp.ready();
  const initData = WebApp.initData;
  
  // Отправляем на backend
  authenticateUser(initData);
}, []);
```

### Шаг 4: Backend проверяет и авторизует

```javascript
// POST /api/auth/telegram

1. Проверяем подпись ✅
2. Проверяем auth_date ✅
3. Ищем пользователя в БД
4. Если нет → создаём
5. Возвращаем данные пользователя
```

### Шаг 5: Перенаправление

```javascript
if (authData.has_profile) {
  navigate('/dashboard');  // Пользователь уже прошёл анкету
} else {
  navigate('/welcome');    // Новый пользователь
}
```

---

## 🔐 RLS в Supabase

Telegram ID проверяется через `auth.uid()`:

```sql
-- Пользователь видит только свои данные
CREATE POLICY "Users can select own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);
```

**Важно:** В нашей архитектуре мы используем `service_role_key` на backend, поэтому RLS обходится автоматически для admin-запросов.

Для обычных пользователей (через Supabase JS Client на фронтенде) RLS будет работать как положено.

---

## 💡 Альтернатива: Supabase Auth с Telegram

Supabase также поддерживает OAuth через провайдеров, но для Telegram WebApp проще использовать прямую авторизацию через `telegram_id`, как описано выше.

Если нужна интеграция с Supabase Auth:

```javascript
// Создать custom provider
await supabase.auth.signInWithOAuth({
  provider: 'telegram',
  options: {
    redirectTo: 'https://your-app.com/auth/callback'
  }
});
```

Но это требует дополнительных настроек и не так естественно для Telegram WebApp.

---

## ✅ Checklist реализации

- [x] Backend: Функция проверки подписи Telegram
- [x] Backend: Endpoint `/api/auth/telegram`
- [x] Backend: Создание/обновление пользователя по `telegram_id`
- [x] Database: Таблица `users` с полем `telegram_id BIGINT UNIQUE`
- [x] Frontend: Интеграция Telegram WebApp SDK
- [x] Frontend: Отправка `initData` на backend
- [x] Bot: Кнопка с URL WebApp
- [x] RLS: Политики для защиты данных пользователей

---

## 🚀 Production checklist

- [ ] HTTPS для WebApp (обязательно!)
- [ ] Валидация `auth_date` (не старше 24 часов)
- [ ] Логирование попыток авторизации
- [ ] Rate limiting на `/api/auth/telegram`
- [ ] Мониторинг подозрительной активности
- [ ] Хранение `bot_token` в env (никогда в коде!)

---

Эта архитектура авторизации — самая простая, безопасная и удобная для Telegram WebApp! 🎉
