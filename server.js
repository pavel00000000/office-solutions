const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

console.log('1. Начинаю запуск сервера...');

dotenv.config();
console.log('2. Переменные окружения загружены:', {
    token: process.env.TELEGRAM_TOKEN ? 'Есть' : 'Нет',
    chatId: process.env.CHAT_ID ? 'Есть' : 'Нет',
    port: process.env.PORT
});

const app = express();
const port = process.env.PORT || 3000;

console.log('3. Создаю бота...');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false }); // Отключаем polling

// Настраиваем webhook
const webhookUrl = `https://your-app.onrender.com/bot${process.env.TELEGRAM_TOKEN}`; // Замените на ваш домен
bot.setWebHook(webhookUrl).then(() => {
    console.log(`Webhook установлен: ${webhookUrl}`);
}).catch(err => {
    console.error('Ошибка установки webhook:', err);
});

console.log('4. Настраиваю middleware...');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Маршрут для обработки обновлений от Telegram
app.post(`/bot${process.env.TELEGRAM_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.post('/submit', (req, res) => {
    console.log('5. Получен запрос на /submit:', req.body);
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

    bot.sendMessage(process.env.CHAT_ID, message)
        .then(() => res.status(200).json({ success: true }))
        .catch((error) => {
            console.error('Ошибка отправки в Telegram:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
        });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(`Ваш CHAT_ID: ${chatId}`);
    bot.sendMessage(chatId, 'Привет! Я получил ваше сообщение.');
});

app.listen(port, () => {
    console.log(`6. Сервер запущен на http://localhost:${port}`);
});