import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не установлен!');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Лень-в-Пень Bot запущен!');

// Команда /start - отправляем клавиатуру с кнопкой
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'товарищ';

  const welcomeMessage = `Привет, ${firstName}! 👋

Нажми кнопку "🚀 СТАРТ" внизу, чтобы начать.`;

  // Постоянная клавиатура с кнопкой WebApp
  const keyboard = {
    keyboard: [[
      {
        text: '🚀 СТАРТ',
        web_app: { url: webAppUrl }
      }
    ]],
    resize_keyboard: true,  // Компактный размер кнопки
    persistent: true         // Кнопка всегда видна
  };

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard
  });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `📚 *Помощь*

🎯 *Основные функции:*
— Установка главной цели
— Отслеживание зависимостей
— Ежедневные отчёты
— Расчёт прогресса

📝 *Команды:*
/start — Начать работу
/help — Помощь
/report — Заполнить дневной отчёт

💡 Открой приложение кнопкой ниже.`;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📱 Открыть приложение',
        web_app: { url: webAppUrl }
      }
    ]]
  };

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Команда /report
bot.onText(/\/report/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📝 Заполнить отчёт',
        web_app: { url: `${webAppUrl}/daily-report` }
      }
    ]]
  };

  bot.sendMessage(
    chatId,
    '📝 Нажми кнопку ниже, чтобы заполнить дневной отчёт.',
    { reply_markup: keyboard }
  );
});

// Обработка нажатия на кнопку "🚀 СТАРТ"
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Пропускаем команды (они обрабатываются отдельно)
  if (text && text.startsWith('/')) return;

  // Если нажата кнопка "🚀 СТАРТ" - показываем приветствие
  if (text === '🚀 СТАРТ') {
    const firstName = msg.from.first_name || 'товарищ';
    
    const welcomeMessage = `📱 ЛЕНЬ-В-ПЕНЬ

🔥 Готов наконец-то поднять жопу с дивана и перестать жить на автопилоте, ${firstName}?

— Мы не будем тебя жалеть.
— Мы не будем гладить по голове.
— Мы здесь, чтобы выбить из тебя хаос и собрать дисциплину по кускам. 💥

Нажми кнопку ниже, чтобы открыть приложение.`;

    const keyboard = {
      keyboard: [[
        {
          text: '🚀 СТАРТ',
          web_app: { url: webAppUrl }
        }
      ]],
      resize_keyboard: true,
      persistent: true
    };

    bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard
    });
  }
  // На все остальные текстовые сообщения - игнорируем (не отвечаем)
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Функция отправки напоминаний (можно вызывать по расписанию)
export async function sendReminder(chatId, message) {
  try {
    const keyboard = {
      inline_keyboard: [[
        {
          text: '📝 Заполнить отчёт',
          web_app: { url: `${webAppUrl}/daily-report` }
        }
      ]]
    };

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Send reminder error:', error);
  }
}

export default bot;
