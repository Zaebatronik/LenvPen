import crypto from 'crypto';

/**
 * Проверка подписи Telegram WebApp
 * @param {string} initData - данные от Telegram WebApp
 * @param {string} botToken - токен бота
 * @returns {boolean}
 */
export function verifyTelegramWebAppData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Сортируем параметры
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаём секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

/**
 * Парсинг initData от Telegram
 * @param {string} initData
 * @returns {Object}
 */
export function parseTelegramInitData(initData) {
  const urlParams = new URLSearchParams(initData);
  const user = urlParams.get('user');
  
  if (!user) {
    throw new Error('No user data in initData');
  }

  const userData = JSON.parse(user);
  
  return {
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    username: userData.username,
    photo_url: userData.photo_url,
    auth_date: parseInt(urlParams.get('auth_date'))
  };
}

/**
 * Проверка актуальности auth_date (не старше 24 часов)
 * @param {number} authDate - timestamp
 * @returns {boolean}
 */
export function isAuthDateValid(authDate) {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 часа
  return (now - authDate) <= maxAge;
}
