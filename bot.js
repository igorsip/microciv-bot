const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

function createBot(token, serverUrl) {
  const bot = new TelegramBot(token, { polling: true });
  
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    db.getOrCreatePlayer(user.id, {
      username: user.username,
      first_name: user.first_name
    });
    
    const welcomeMessage = `
🏛 Добро пожаловать в MicroCiv 2.0! 🏛

Ты — правитель новой цивилизации. Твоя задача — развивать её от Каменного века к Информационной эре!

🎮 Управляй:
• 🌾 Едой - кормит население
• 🏭 Производством - строит здания
• 🔬 Наукой - открывает технологии
• 💰 Золотом - торговля и найм
• 🎨 Культурой - расширение территории
• ⛪ Верой - благословения
• 😊 Счастьем - благосостояние

📊 Твоя империя уже ждет тебя!
    `;
    
    bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть', web_app: { url: `${serverUrl}/?userId=${user.id}` } }],
          [{ text: '📊 Статистика', callback_data: 'stats' }],
          [{ text: '🔬 Технологии', callback_data: 'techs' }],
          [{ text: '❓ Помощь', callback_data: 'help' }]
        ]
      }
    });
  });
  
  bot.onText(/\/play/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    bot.sendMessage(chatId, '🎮 Открываю твою империю...', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏛 Войти в игру', web_app: { url: `${serverUrl}/?userId=${userId}` } }]
        ]
      }
    });
  });
  
  bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const stats = db.getPlayerStats(userId);
    if (!stats.gameData) {
      bot.sendMessage(chatId, 'Сначала начни игру командой /start');
      return;
    }
    
    const g = stats.gameData;
    const statsMessage = `
📊 Статистика твоей цивилизации:

🏛 Эпоха: ${g.era_name}

💰 Ресурсы:
🌾 Еда: ${g.food} (+${g.food_per_sec.toFixed(2)}/сек)
🏭 Производство: ${g.production} (+${g.production_per_sec.toFixed(2)}/сек)
🔬 Наука: ${g.science} (+${g.science_per_sec.toFixed(2)}/сек)
💰 Золото: ${g.gold} (+${g.gold_per_sec.toFixed(2)}/сек)
🎨 Культура: ${g.culture} (+${g.culture_per_sec.toFixed(2)}/сек)
⛪ Вера: ${g.faith} (+${g.faith_per_sec.toFixed(2)}/сек)
😊 Счастье: ${g.happiness}%

🏗 Здания: ${Object.values(g.buildings).reduce((a, b) => a + b, 0)} построено

👥 Население: ${g.population}
🔄 Ход: ${g.turn}

🔬 Исследованных технологий: ${g.technologies.length}
    `;
    
    bot.sendMessage(chatId, statsMessage);
  });
  
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
📖 Справка по MicroCiv 2.0

🎯 Цель игры:
Развивай свою цивилизацию от Каменного века к Информационной эре!

🌍 Эпохи:
⛏️ Каменный век → 📜 Древность → 🏰 Средневековье → 🎨 Ренессанс → 🏭 Промышленность → 💻 Информационная эра

🔬 Технологии:
Исследуй 50+ технологий для разблокировки новых возможностей

🏗 Здания:
Строй различные здания для повышения производства ресурсов

💡 Совет:
Сначала исследуй Земледелие, потом Письменность для развития науки!

⭐️ Монетизация:
Скоро будут премиум-бонусы за Telegram Stars!
    `;
    
    bot.sendMessage(chatId, helpMessage);
  });
  
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    
    if (data === 'stats') {
      bot.answerCallbackQuery(query.id);
      
      const stats = db.getPlayerStats(userId);
      if (!stats.gameData) {
        bot.sendMessage(chatId, 'Сначала начни игру командой /start');
        return;
      }
      
      const g = stats.gameData;
      const msg = `
📊 Твоя империя (${g.era_name}):

💰 Ресурсы:
🌾 ${g.food} (+${g.food_per_sec.toFixed(2)}/с)
🏭 ${g.production} (+${g.production_per_sec.toFixed(2)}/с)
🔬 ${g.science} (+${g.science_per_sec.toFixed(2)}/с)
💰 ${g.gold} (+${g.gold_per_sec.toFixed(2)}/с)
🎨 ${g.culture} (+${g.culture_per_sec.toFixed(2)}/с)

🔬 Технологии: ${g.technologies.length} изучено
👥 Население: ${g.population}
      `;
      
      bot.sendMessage(chatId, msg);
    } else if (data === 'techs') {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '🔬 Открой игру через Web App чтобы исследовать технологии!');
    } else if (data === 'help') {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '📖 Используй /help для получения полной справки');
    }
  });
  
  console.log('✅ Telegram бот запущен (версия 2.0)');
  return bot;
}

module.exports = { createBot };
