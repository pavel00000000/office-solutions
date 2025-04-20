const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error('Ошибка: TELEGRAM_TOKEN и CHAT_ID должны быть заданы в .env');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN);

app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Сервер работает. Используйте /submit для отправки формы.' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/submit', (req, res) => {
  const { name, age, phone, city } = req.body;
  if (!name || !age || !phone || !city) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (isNaN(age) || age < 16) {
    return res.status(400).json({ error: 'Возраст должен быть числом и не менее 16 лет' });
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

if (process.env.NODE_ENV === 'production') {
  const webhookUrl = `https://workoffice.website/bot${TELEGRAM_TOKEN}`;

  bot.setWebHook(webhookUrl)
    .then(() => console.log(`Webhook установлен: ${webhookUrl}`))
    .catch((err) => console.error('Ошибка установки Webhook:', err.message));

  app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
} else {
  bot.startPolling({ restart: true });
  console.log('Polling запущен для локального режима');
}

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// 🔥 ВАЖНО: здесь слушаем не localhost, а 0.0.0.0!
app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://0.0.0.0:${port}`);
});

