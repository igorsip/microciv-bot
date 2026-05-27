// Telegram Web App API
let tg = window.Telegram.WebApp;
tg.expand();

// Определяем URL сервера
const SERVER_URL = window.location.origin;

// Получаем ID пользователя
let userId = null;
const urlParams = new URLSearchParams(window.location.search);
userId = urlParams.get('userId');

if (!userId && tg.initDataUnsafe?.user?.id) {
    userId = tg.initDataUnsafe.user.id;
}

// Локальное хранилище данных игры
let gameData = null;
let resourcesInterval = null;

// Инициализация игры
async function initGame() {
    if (!userId) {
        showError('Не удалось получить ID пользователя. Открой игру из Telegram бота.');
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/player/${userId}`);
        const data = await response.json();

        if (data.error) {
            showError('Игрок не найден. Начни игру командой /start в боте.');
            return;
        }

        gameData = data.game;
        updateUI();
        startResourceGeneration();

        // Скрываем загрузку, показываем игру
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading game:', error);
        showError('Ошибка загрузки игры. Проверь соединение.');
    }
}

// Обновление UI
function updateUI() {
    if (!gameData) return;

    // Ресурсы
    document.getElementById('food').textContent = Math.floor(gameData.food);
    document.getElementById('production').textContent = Math.floor(gameData.production);
    document.getElementById('science').textContent = Math.floor(gameData.science);

    document.getElementById('food-rate').textContent = `+${gameData.food_per_sec.toFixed(1)}/с`;
    document.getElementById('production-rate').textContent = `+${gameData.production_per_sec.toFixed(1)}/с`;
    document.getElementById('science-rate').textContent = `+${gameData.science_per_sec.toFixed(1)}/с`;

    // Статистика
    document.getElementById('population').textContent = gameData.population;
    
    const buildingsCount = 
        gameData.farm_count + 
        gameData.barracks_count + 
        gameData.library_count + 
        gameData.market_count + 
        gameData.workshop_count;
    document.getElementById('buildings-count').textContent = buildingsCount;

    // Количество зданий
    document.getElementById('farm-count').textContent = gameData.farm_count;
    document.getElementById('barracks-count').textContent = gameData.barracks_count;
    document.getElementById('library-count').textContent = gameData.library_count;
    document.getElementById('market-count').textContent = gameData.market_count;
    document.getElementById('workshop-count').textContent = gameData.workshop_count;

    // Проверяем доступность кнопок строительства
    updateBuildButtons();
}

// Обновление доступности кнопок строительства
function updateBuildButtons() {
    const costs = {
        farm: { food: 0, production: 20, science: 0 },
        barracks: { food: 10, production: 30, science: 0 },
        library: { food: 5, production: 25, science: 5 },
        market: { food: 15, production: 40, science: 10 },
        workshop: { food: 10, production: 50, science: 15 }
    };

    for (const [building, cost] of Object.entries(costs)) {
        const card = document.querySelector(`[data-building="${building}"]`);
        const btn = card.querySelector('.build-btn');
        
        const canAfford = 
            gameData.food >= cost.food &&
            gameData.production >= cost.production &&
            gameData.science >= cost.science;

        btn.disabled = !canAfford;
        
        if (canAfford) {
            card.style.opacity = '1';
        } else {
            card.style.opacity = '0.6';
        }
    }
}

// Генерация ресурсов локально (плавное обновление)
function startResourceGeneration() {
    if (resourcesInterval) {
        clearInterval(resourcesInterval);
    }

    resourcesInterval = setInterval(() => {
        if (!gameData) return;

        // Локально увеличиваем ресурсы
        gameData.food += gameData.food_per_sec;
        gameData.production += gameData.production_per_sec;
        gameData.science += gameData.science_per_sec;

        updateUI();
    }, 1000);

    // Синхронизация с сервером каждые 10 секунд
    setInterval(async () => {
        await syncWithServer();
    }, 10000);
}

// Синхронизация с сервером
async function syncWithServer() {
    try {
        const response = await fetch(`${SERVER_URL}/api/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();
        if (data.success) {
            gameData = data.game;
            updateUI();
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Построить здание
async function buildBuilding(buildingType) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Строим...';

    try {
        const response = await fetch(`${SERVER_URL}/api/build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                building: buildingType
            })
        });

        const data = await response.json();

        if (data.error) {
            showNotification('❌ ' + data.error, 'error');
            btn.disabled = false;
            btn.textContent = 'Построить';
            return;
        }

        if (data.success) {
            gameData = data.game;
            updateUI();
            
            const buildingNames = {
                farm: 'Ферма',
                barracks: 'Казарма',
                library: 'Библиотека',
                market: 'Рынок',
                workshop: 'Мастерская'
            };
            
            showNotification(`✅ ${buildingNames[buildingType]} построена!`, 'success');
            
            // Вибрация при успехе
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }

    } catch (error) {
        console.error('Build error:', error);
        showNotification('❌ Ошибка строительства', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Построить';
    }
}

// Обновить игру
async function refreshGame() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🔄 Обновление...';

    await syncWithServer();
    
    showNotification('✅ Игра обновлена!', 'success');
    
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🔄 Обновить';
    }, 1000);
}

// Показать помощь
function showHelp() {
    document.getElementById('help-modal').classList.remove('hidden');
}

// Закрыть помощь
function closeHelp() {
    document.getElementById('help-modal').classList.add('hidden');
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
        max-width: 90%;
        text-align: center;
        font-weight: bold;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Показать ошибку
function showError(message) {
    document.getElementById('loading').innerHTML = `
        <div style="color: white; text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <p style="font-size: 18px;">${message}</p>
        </div>
    `;
}

// Стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Запуск игры при загрузке
window.addEventListener('DOMContentLoaded', initGame);

// Остановка генерации при выходе
window.addEventListener('beforeunload', () => {
    if (resourcesInterval) {
        clearInterval(resourcesInterval);
    }
});
