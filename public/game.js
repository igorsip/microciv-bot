let tg = window.Telegram.WebApp;
tg.expand();

const SERVER_URL = window.location.origin;
let userId = new URLSearchParams(window.location.search).get('userId');
if (!userId && tg.initDataUnsafe?.user?.id) userId = tg.initDataUnsafe.user.id;

let gameData = null;
let allTechs = null;
let resourcesInterval = null;

async function initGame() {
    if (!userId) {
        showError('Не удалось получить ID');
        return;
    }

    try {
        const [playerRes, techsRes] = await Promise.all([
            fetch(`${SERVER_URL}/api/player/${userId}`),
            fetch(`${SERVER_URL}/api/techs/all`)
        ]);

        const playerData = await playerRes.json();
        const techsData = await techsRes.json();

        if (playerData.error) {
            showError('Начни игру командой /start в боте');
            return;
        }

        gameData = playerData.game;
        allTechs = techsData.techs;

        updateUI();
        renderBuildings();
        renderTechs();
        startResourceGeneration();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading game:', error);
        showError('Ошибка загрузки игры');
    }
}

function updateUI() {
    if (!gameData) return;

    // Ресурсы
    document.getElementById('food').textContent = Math.floor(gameData.food);
    document.getElementById('production').textContent = Math.floor(gameData.production);
    document.getElementById('science').textContent = Math.floor(gameData.science);
    document.getElementById('gold').textContent = Math.floor(gameData.gold);
    document.getElementById('culture').textContent = Math.floor(gameData.culture);
    document.getElementById('faith').textContent = Math.floor(gameData.faith);
    document.getElementById('happiness').textContent = Math.floor(gameData.happiness);

    document.getElementById('food-rate').textContent = gameData.food_per_sec.toFixed(2);
    document.getElementById('production-rate').textContent = gameData.production_per_sec.toFixed(2);
    document.getElementById('science-rate').textContent = gameData.science_per_sec.toFixed(2);
    document.getElementById('gold-rate').textContent = gameData.gold_per_sec.toFixed(2);
    document.getElementById('culture-rate').textContent = gameData.culture_per_sec.toFixed(2);
    document.getElementById('faith-rate').textContent = gameData.faith_per_sec.toFixed(2);

    // Эра
    document.getElementById('era-name').textContent = gameData.era_name;

    // Статистика
    document.getElementById('population').textContent = gameData.population;
    const buildingsCount = Object.values(gameData.buildings).reduce((a, b) => a + b, 0);
    document.getElementById('buildings-count').textContent = buildingsCount;
    document.getElementById('techs-count').textContent = gameData.technologies.length;
    document.getElementById('military').textContent = gameData.military_strength.toFixed(1);

    updateBuildButtons();
}

function renderBuildings() {
    const buildings = [
        { id: 'farm', name: 'Ферма', icon: '🌾', cost: { production: 20 }, effect: '+0.3 🌾/с' },
        { id: 'barracks', name: 'Казарма', icon: '⚔️', cost: { food: 10, production: 30 }, effect: '+0.2 🏭/с' },
        { id: 'library', name: 'Библиотека', icon: '📚', cost: { food: 5, production: 25, science: 5 }, effect: '+0.2 🔬/с' },
        { id: 'market', name: 'Рынок', icon: '🏪', cost: { food: 15, production: 40, gold: 20 }, effect: '+0.2 💰/с' },
        { id: 'workshop', name: 'Мастерская', icon: '🔧', cost: { production: 50, science: 15 }, effect: '+0.5 🏭/с' },
        { id: 'granary', name: 'Амбар', icon: '🌾', cost: { production: 15, gold: 5 }, effect: '+0.1 🌾/с' },
        { id: 'temple', name: 'Храм', icon: '⛪', cost: { production: 20, gold: 15 }, effect: '+0.2 ⛪/с' },
        { id: 'palace', name: 'Дворец', icon: '👑', cost: { food: 50, production: 100, gold: 100 }, effect: '+0.5 💰/с' }
    ];

    const html = buildings.map(b => `
        <div class="building-card">
            <div class="building-icon">${b.icon}</div>
            <div class="building-name">${b.name}</div>
            <div class="building-effect">${b.effect}</div>
            <div class="building-cost">${Object.entries(b.cost).map(([k, v]) => `${v} ${k}`).join(' ')}</div>
            <div style="font-size: 11px; color: #888;">Построено: ${gameData.buildings[b.id]}</div>
            <button class="build-btn" onclick="buildBuilding('${b.id}')">Построить</button>
        </div>
    `).join('');

    document.getElementById('buildings-grid').innerHTML = html;
}

function renderTechs() {
    const html = Object.entries(allTechs)
        .filter(([id]) => !gameData.technologies.includes(id))
        .slice(0, 15)
        .map(([id, tech]) => `
            <div class="tech-card">
                <div class="tech-header">
                    <span><span class="tech-icon">${tech.icon}</span> ${tech.name}</span>
                    <span class="tech-time">${tech.time} мин</span>
                </div>
                <div style="font-size: 11px; color: #666; margin-bottom: 8px;">${tech.description}</div>
                <button class="tech-btn" onclick="startResearch('${id}')">Исследовать</button>
            </div>
        `).join('');

    document.getElementById('techs-list').innerHTML = html;
}

function updateBuildButtons() {
    // Простая проверка доступности
}

function startResourceGeneration() {
    if (resourcesInterval) clearInterval(resourcesInterval);

    resourcesInterval = setInterval(() => {
        if (!gameData) return;

        gameData.food += gameData.food_per_sec;
        gameData.production += gameData.production_per_sec;
        gameData.science += gameData.science_per_sec;
        gameData.gold += gameData.gold_per_sec;
        gameData.culture += gameData.culture_per_sec;
        gameData.faith += gameData.faith_per_sec;

        updateUI();
    }, 1000);

    setInterval(async () => {
        await syncWithServer();
    }, 10000);
}

async function syncWithServer() {
    try {
        const res = await fetch(`${SERVER_URL}/api/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data.success) {
            gameData = data.game;
            updateUI();
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

async function buildBuilding(buildingType) {
    try {
        const res = await fetch(`${SERVER_URL}/api/build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, building: buildingType })
        });

        const data = await res.json();
        if (data.error) {
            showNotification('❌ ' + data.error, 'error');
            return;
        }

        if (data.success) {
            gameData = data.game;
            updateUI();
            renderBuildings();
            showNotification('✅ Здание построено!', 'success');
        }
    } catch (error) {
        console.error('Build error:', error);
        showNotification('❌ Ошибка', 'error');
    }
}

async function startResearch(techId) {
    try {
        const res = await fetch(`${SERVER_URL}/api/research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, techId })
        });

        const data = await res.json();
        if (data.error) {
            showNotification('❌ ' + data.error, 'error');
            return;
        }

        if (data.success) {
            gameData = data.game;
            updateUI();
            renderTechs();
            showNotification('🔬 Исследование начато!', 'success');
        }
    } catch (error) {
        console.error('Research error:', error);
        showNotification('❌ Ошибка', 'error');
    }
}

async function refreshGame() {
    await syncWithServer();
    showNotification('✅ Обновлено!', 'success');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabName + '-tab').classList.remove('hidden');
    event.target.classList.add('active');
}

function showHelp() {
    document.getElementById('help-modal').classList.remove('hidden');
}

function closeHelp() {
    document.getElementById('help-modal').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function showError(message) {
    document.getElementById('loading').innerHTML = `
        <div style="color: white; text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <p>${message}</p>
        </div>
    `;
}

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

window.addEventListener('DOMContentLoaded', initGame);
window.addEventListener('beforeunload', () => {
    if (resourcesInterval) clearInterval(resourcesInterval);
});
