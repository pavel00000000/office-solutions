const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Проверка переменных окружения
const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error('Ошибка: TELEGRAM_TOKEN и CHAT_ID должны быть заданы в .env');
  process.exit(1);
}

// Инициализация Telegram бота с polling
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Middleware
app.use(cors({ origin: '*' })); // Разрешаем запросы с любого источника
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // Статические файлы из корневой директории

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Корневой маршрут для API
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Сервер работает. Используйте /submit для отправки формы.' });
});

// Обслуживание index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка формы
app.post('/submit', (req, res) => {
  const { name, age, phone, city } = req.body;
  if (!name || !age || !phone || !city) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (isNaN(age) || age < 18) {
    return res.status(400).json({ error: 'Возраст должен быть числом и не менее 18 лет' });
  }

  const message = `
    Новая заявка:
    Имя: ${name}
    Возраст: ${age}
    Телефон: ${phone}
    Город: ${city}
    Дата: ${new Date().toLocaleString('ru-RU')}
  `;

  bot.sendMessage(CHAT_ID, message)
    .then(() => {
      console.log('Сообщение успешно отправлено в Telegram');
      res.status(200).json({ success: true });
    })
    .catch((error) => {
      console.error('Ошибка отправки в Telegram:', error.message);
      res.status(500).json({ error: 'Ошибка сервера' });
    });
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});