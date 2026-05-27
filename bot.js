const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

function createBot(token, serverUrl) {
  const bot = new TelegramBot(token, { polling: true });
  
  // Команда /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    // Создаем игрока в базе
    db.getOrCreatePlayer(user.id, {
      username: user.username,
      first_name: user.first_name
    });
    
    const welcomeMessage = `
🏛 Добро пожаловать в MicroCiv! 🏛

Ты — правитель новой цивилизации. Твоя задача — развивать город, исследовать технологии и стать величайшей державой!

🎮 Управляй:
• 🌾 Едой - кормит население
• 🏭 Производством - строит здания
• 🔬 Наукой - открывает технологии

📊 Твоя империя уже ждет тебя!
    `;
    
    bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть', web_app: { url: `${serverUrl}/?userId=${user.id}` } }],
          [{ text: '📊 Статистика', callback_data: 'stats' }],
          [{ text: '❓ Помощь', callback_data: 'help' }]
        ]
      }
    });
  });
  
  // Команда /play
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
  
  // Команда /stats
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

💰 Ресурсы:
🌾 Еда: ${g.food} (+${g.food_per_sec.toFixed(1)}/сек)
🏭 Производство: ${g.production} (+${g.production_per_sec.toFixed(1)}/сек)
🔬 Наука: ${g.science} (+${g.science_per_sec.toFixed(1)}/сек)

🏗 Здания:
🌾 Ферм: ${g.farm_count}
⚔️ Казарм: ${g.barracks_count}
📚 Библиотек: ${g.library_count}
🏪 Рынков: ${g.market_count}
🔧 Мастерских: ${g.workshop_count}

👥 Население: ${g.population}
🔄 Ход: ${g.turn}
    `;
    
    bot.sendMessage(chatId, statsMessage);
  });
  
  // Команда /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
📖 Справка по MicroCiv

🎯 Цель игры:
Развивай свою цивилизацию, строй здания, исследуй технологии!

🏗 Здания:
🌾 Ферма - производит еду
⚔️ Казарма - обучает войска
📚 Библиотека - генерирует науку
🏪 Рынок - улучшает экономику
🔧 Мастерская - ускоряет производство

💡 Команды:
/start - Начать игру
/play - Открыть игру
/stats - Показать статистику
/help - Эта справка

⭐️ Монетизация:
В будущем можно будет покупать ускорения и бонусы за Telegram Stars!
    `;
    
    bot.sendMessage(chatId, helpMessage);
  });
  
  // Обработка callback кнопок
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
      const statsMessage = `
📊 Твоя империя:

💰 Ресурсы:
🌾 ${g.food} (+${g.food_per_sec.toFixed(1)}/с)
🏭 ${g.production} (+${g.production_per_sec.toFixed(1)}/с)
🔬 ${g.science} (+${g.science_per_sec.toFixed(1)}/с)

🏗 Зданий построено: ${g.farm_count + g.barracks_count + g.library_count + g.market_count + g.workshop_count}
      `;
      
      bot.sendMessage(chatId, statsMessage);
    } else if (data === 'help') {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '📖 Используй /help для получения полной справки');
    }
  });
  
  console.log('✅ Telegram бот запущен');
  return bot;
}

module.exports = { createBot };
