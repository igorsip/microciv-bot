require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createBot } = require('./bot');
const db = require('./database');
const { getAllTechs, getTechsByEra, canResearchTech, getTechTime } = require('./tech-tree');

// Проверка переменных окружения
if (!process.env.BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не найден в .env файле!');
  console.error('📝 Создай файл .env и добавь токен от @BotFather');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

// Инициализация базы данных
db.initDatabase();

// Создание Express сервера
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoints
// Получить данные игрока
app.get('/api/player/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  
  try {
    const stats = db.getPlayerStats(userId);
    if (!stats.gameData) {
      return res.status(404).json({ error: 'Игрок не найден' });
    }
    
    res.json({
      player: stats.player,
      game: stats.gameData
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Построить здание
app.post('/api/build', (req, res) => {
  const { userId, building } = req.body;
  
  if (!userId || !building) {
    return res.status(400).json({ error: 'Missing userId or building' });
  }
  
  try {
    const result = db.buildBuilding(parseInt(userId), building);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Возвращаем обновленные данные
    const stats = db.getPlayerStats(parseInt(userId));
    res.json({
      success: true,
      game: stats.gameData
    });
  } catch (error) {
    console.error('Error building:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить ресурсы (вызывается периодически из игры)
app.post('/api/update', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  
  try {
    const updated = db.updateResources(parseInt(userId));
    const stats = db.getPlayerStats(parseInt(userId));
    
    res.json({
      success: true,
      game: stats.gameData
    });
  } catch (error) {
    console.error('Error updating resources:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить все технологии
app.get('/api/techs/all', (req, res) => {
  try {
    const allTechs = getAllTechs();
    res.json({ techs: allTechs });
  } catch (error) {
    console.error('Error fetching techs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить технологии эпохи
app.get('/api/techs/era/:eraLevel', (req, res) => {
  try {
    const eraLevel = parseInt(req.params.eraLevel);
    const era = getTechsByEra(eraLevel);
    
    if (!era) {
      return res.status(404).json({ error: 'Era not found' });
    }
    
    res.json(era);
  } catch (error) {
    console.error('Error fetching era:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Начать исследование технологии
app.post('/api/research', (req, res) => {
  const { userId, techId } = req.body;
  
  if (!userId || !techId) {
    return res.status(400).json({ error: 'Missing userId or techId' });
  }
  
  try {
    const gameData = db.getGameData(parseInt(userId));
    
    if (!gameData) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Проверяем может ли быть исследована
    if (!canResearchTech(techId, gameData.technologies)) {
      return res.status(400).json({ error: 'Technology requirements not met' });
    }
    
    const result = db.startResearch(parseInt(userId), techId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    const stats = db.getPlayerStats(parseInt(userId));
    res.json({
      success: true,
      game: stats.gameData
    });
  } catch (error) {
    console.error('Error researching tech:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║     🏛 MicroCiv Server Started 🏛    ║
╚═══════════════════════════════════════╝

🌐 Server URL: ${SERVER_URL}
📡 Port: ${PORT}
🤖 Bot: Starting...
  `);
  
  // Запуск бота
  createBot(process.env.BOT_TOKEN, SERVER_URL);
  
  console.log(`
✅ Всё готово! Открой Telegram и напиши своему боту /start
  `);
});
