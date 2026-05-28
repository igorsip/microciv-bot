const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'game-data.json');

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

function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

let database = loadDatabase();

function initDatabase() {
  console.log('✅ База данных (JSON) инициализирована');
}

function getOrCreatePlayer(telegramId, userData = {}) {
  if (!database.players[telegramId]) {
    database.players[telegramId] = {
      telegram_id: telegramId,
      username: userData.username || null,
      first_name: userData.first_name || 'Player',
      created_at: Math.floor(Date.now() / 1000),
      last_active: Math.floor(Date.now() / 1000)
    };

    // 7 ресурсов + эпохи
    database.gameData[telegramId] = {
      telegram_id: telegramId,
      
      // 7 ресурсов
      food: 100,
      production: 50,
      science: 20,
      gold: 10,
      culture: 5,
      faith: 0,
      happiness: 50,
      
      // Генерация в сек
      food_per_sec: 0.5,
      production_per_sec: 0.3,
      science_per_sec: 0.1,
      gold_per_sec: 0.05,
      culture_per_sec: 0.02,
      faith_per_sec: 0.01,
      
      // Система эпох
      era: 0,  // Каменный век (0-5)
      era_name: "Каменный век",
      
      // Технологии
      technologies: [], // массив ID технологий
      current_research: null, // ID исследуемой технологии
      research_progress: 0, // от 0 до 100
      research_speed: 1.0, // множитель скорости исследования
      
      // Здания (новое)
      buildings: {
        farm: 0,
        barracks: 0,
        library: 0,
        market: 0,
        workshop: 0,
        granary: 0,
        temple: 0,
        palace: 0
      },
      
      // Население и счастье
      population: 1,
      population_growth: 0.05,
      
      // Военное
      military_strength: 1.0,
      city_defense: 1.0,
      
      // Торговля
      trade_capacity: 1.0,
      
      // Игровой прогресс
      turn: 1,
      last_update: Math.floor(Date.now() / 1000),
      total_playtime: 0
    };

    saveDatabase(database);
  } else {
    database.players[telegramId].last_active = Math.floor(Date.now() / 1000);
    saveDatabase(database);
  }

  return database.players[telegramId];
}

function getGameData(telegramId) {
  return database.gameData[telegramId] || null;
}

function updateResources(telegramId) {
  const gameData = getGameData(telegramId);
  if (!gameData) return null;

  const now = Math.floor(Date.now() / 1000);
  const timePassed = now - gameData.last_update;

  // Обновляем все 7 ресурсов
  const newFood = Math.floor(gameData.food + (gameData.food_per_sec * timePassed));
  const newProduction = Math.floor(gameData.production + (gameData.production_per_sec * timePassed));
  const newScience = Math.floor(gameData.science + (gameData.science_per_sec * timePassed));
  const newGold = Math.floor(gameData.gold + (gameData.gold_per_sec * timePassed));
  const newCulture = Math.floor(gameData.culture + (gameData.culture_per_sec * timePassed));
  const newFaith = Math.floor(gameData.faith + (gameData.faith_per_sec * timePassed));

  // Обновляем исследование технологий
  if (gameData.current_research) {
    gameData.research_progress += (gameData.science_per_sec * timePassed * gameData.research_speed);
  }

  gameData.food = newFood;
  gameData.production = newProduction;
  gameData.science = newScience;
  gameData.gold = newGold;
  gameData.culture = newCulture;
  gameData.faith = newFaith;
  gameData.last_update = now;

  saveDatabase(database);

  return {
    food: newFood,
    production: newProduction,
    science: newScience,
    gold: newGold,
    culture: newCulture,
    faith: newFaith,
    timePassed
  };
}

function startResearch(telegramId, techId) {
  const gameData = getGameData(telegramId);
  if (!gameData) return { success: false, error: 'Игрок не найден' };

  gameData.current_research = techId;
  gameData.research_progress = 0;

  saveDatabase(database);
  return { success: true };
}

function buildBuilding(telegramId, buildingType) {
  const costs = {
    farm: { food: 0, production: 20, science: 0, gold: 0 },
    barracks: { food: 10, production: 30, science: 0, gold: 10 },
    library: { food: 5, production: 25, science: 5, gold: 0 },
    market: { food: 15, production: 40, science: 10, gold: 20 },
    workshop: { food: 10, production: 50, science: 15, gold: 5 },
    granary: { food: 0, production: 15, science: 0, gold: 5 },
    temple: { food: 5, production: 20, science: 10, gold: 15 },
    palace: { food: 50, production: 100, science: 50, gold: 100 }
  };

  const benefits = {
    farm: { food_per_sec: 0.3 },
    barracks: { food_per_sec: -0.1, production_per_sec: 0.2, military_strength: 0.5 },
    library: { science_per_sec: 0.2 },
    market: { food_per_sec: 0.2, production_per_sec: 0.3, gold_per_sec: 0.2, trade_capacity: 0.2 },
    workshop: { production_per_sec: 0.5, science_per_sec: 0.1 },
    granary: { food_per_sec: 0.1, happiness: 5 },
    temple: { faith_per_sec: 0.2, happiness: 10, culture_per_sec: 0.1 },
    palace: { gold_per_sec: 0.5, culture_per_sec: 0.3, happiness: 20 }
  };

  const cost = costs[buildingType];
  if (!cost) return { success: false, error: 'Неизвестное здание' };

  updateResources(telegramId);
  const gameData = getGameData(telegramId);

  if (gameData.food < cost.food || 
      gameData.production < cost.production || 
      gameData.science < cost.science ||
      gameData.gold < cost.gold) {
    return { success: false, error: 'Недостаточно ресурсов' };
  }

  const benefit = benefits[buildingType];
  gameData.food -= cost.food;
  gameData.production -= cost.production;
  gameData.science -= cost.science;
  gameData.gold -= cost.gold;
  gameData.buildings[buildingType] += 1;
  
  // Применяем эффекты здания
  if (benefit.food_per_sec) gameData.food_per_sec += benefit.food_per_sec;
  if (benefit.production_per_sec) gameData.production_per_sec += benefit.production_per_sec;
  if (benefit.science_per_sec) gameData.science_per_sec += benefit.science_per_sec;
  if (benefit.gold_per_sec) gameData.gold_per_sec += benefit.gold_per_sec;
  if (benefit.culture_per_sec) gameData.culture_per_sec += benefit.culture_per_sec;
  if (benefit.faith_per_sec) gameData.faith_per_sec += benefit.faith_per_sec;
  if (benefit.happiness) gameData.happiness += benefit.happiness;
  if (benefit.military_strength) gameData.military_strength += benefit.military_strength;
  if (benefit.trade_capacity) gameData.trade_capacity += benefit.trade_capacity;

  saveDatabase(database);

  return { success: true };
}

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
  startResearch,
  getPlayerStats
};
