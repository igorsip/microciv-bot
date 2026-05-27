const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'game-data.json');

// Загружаем или создаем файл базы данных
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
      return { players: {}, gameData: {} };
    }
  }
  return { players: {}, gameData: {} };
}

// Сохраняем базу данных
function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

let database = loadDatabase();

// Инициализация базы данных
function initDatabase() {
  console.log('✅ База данных (JSON) инициализирована');
}

// Создать или получить игрока
function getOrCreatePlayer(telegramId, userData = {}) {
  if (!database.players[telegramId]) {
    database.players[telegramId] = {
      telegram_id: telegramId,
      username: userData.username || null,
      first_name: userData.first_name || 'Player',
      created_at: Math.floor(Date.now() / 1000),
      last_active: Math.floor(Date.now() / 1000)
    };

    database.gameData[telegramId] = {
      telegram_id: telegramId,
      food: 50,
      production: 30,
      science: 10,
      population: 1,
      turn: 1,
      food_per_sec: 0.5,
      production_per_sec: 0.3,
      science_per_sec: 0.1,
      farm_count: 0,
      barracks_count: 0,
      library_count: 0,
      market_count: 0,
      workshop_count: 0,
      technologies: [],
      last_update: Math.floor(Date.now() / 1000)
    };

    saveDatabase(database);
  } else {
    // Обновляем последнюю активность
    database.players[telegramId].last_active = Math.floor(Date.now() / 1000);
    saveDatabase(database);
  }

  return database.players[telegramId];
}

// Получить игровые данные
function getGameData(telegramId) {
  return database.gameData[telegramId] || null;
}

// Обновить ресурсы с учетом прошедшего времени
function updateResources(telegramId) {
  const gameData = getGameData(telegramId);
  if (!gameData) return null;

  const now = Math.floor(Date.now() / 1000);
  const timePassed = now - gameData.last_update;

  // Рассчитываем новые ресурсы
  const newFood = Math.floor(gameData.food + (gameData.food_per_sec * timePassed));
  const newProduction = Math.floor(gameData.production + (gameData.production_per_sec * timePassed));
  const newScience = Math.floor(gameData.science + (gameData.science_per_sec * timePassed));

  // Обновляем в памяти
  gameData.food = newFood;
  gameData.production = newProduction;
  gameData.science = newScience;
  gameData.last_update = now;

  saveDatabase(database);

  return {
    food: newFood,
    production: newProduction,
    science: newScience,
    timePassed
  };
}

// Построить здание
function buildBuilding(telegramId, buildingType) {
  const costs = {
    farm: { food: 0, production: 20, science: 0 },
    barracks: { food: 10, production: 30, science: 0 },
    library: { food: 5, production: 25, science: 5 },
    market: { food: 15, production: 40, science: 10 },
    workshop: { food: 10, production: 50, science: 15 }
  };

  const benefits = {
    farm: { food_per_sec: 0.3, production_per_sec: 0, science_per_sec: 0 },
    barracks: { food_per_sec: -0.1, production_per_sec: 0.2, science_per_sec: 0 },
    library: { food_per_sec: 0, production_per_sec: 0, science_per_sec: 0.2 },
    market: { food_per_sec: 0.2, production_per_sec: 0.3, science_per_sec: 0 },
    workshop: { food_per_sec: 0, production_per_sec: 0.5, science_per_sec: 0.1 }
  };

  const cost = costs[buildingType];
  if (!cost) return { success: false, error: 'Неизвестное здание' };

  // Обновляем ресурсы перед проверкой
  updateResources(telegramId);
  const gameData = getGameData(telegramId);

  // Проверяем достаточно ли ресурсов
  if (gameData.food < cost.food ||
    gameData.production < cost.production ||
    gameData.science < cost.science) {
    return { success: false, error: 'Недостаточно ресурсов' };
  }

  // Списываем ресурсы и добавляем здание
  const benefit = benefits[buildingType];
  gameData.food -= cost.food;
  gameData.production -= cost.production;
  gameData.science -= cost.science;
  gameData[`${buildingType}_count`] += 1;
  gameData.food_per_sec += benefit.food_per_sec;
  gameData.production_per_sec += benefit.production_per_sec;
  gameData.science_per_sec += benefit.science_per_sec;

  saveDatabase(database);

  return { success: true };
}

// Получить статистику игрока
function getPlayerStats(telegramId) {
  updateResources(telegramId);
  const gameData = getGameData(telegramId);
  const player = database.players[telegramId];

  return {
    player,
    gameData
  };
}

module.exports = {
  initDatabase,
  getOrCreatePlayer,
  getGameData,
  updateResources,
  buildBuilding,
  getPlayerStats
};
