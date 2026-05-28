// Полное дерево технологий - 50+ технологий
// Разделены на 5 эпох

const TECH_TREE = {
  // ============ КАМЕННЫЙ ВЕК ============
  stone_age: {
    era: "Каменный век",
    eraLevel: 0,
    techs: {
      mining: {
        name: "Добыча",
        icon: "⛏️",
        time: 10,
        requires: [],
        effects: { production_per_sec: 0.1 },
        description: "Начало добычи полезных ископаемых"
      },
      hunting: {
        name: "Охота",
        icon: "🏹",
        time: 10,
        requires: [],
        effects: { food_per_sec: 0.1 },
        description: "Охота на диких животных"
      },
      fire: {
        name: "Огонь",
        icon: "🔥",
        time: 15,
        requires: ["hunting"],
        effects: { food_per_sec: 0.2 },
        description: "Приготовление пищи на огне"
      }
    }
  },

  // ============ ДРЕВНОСТЬ ============
  ancient: {
    era: "Древность",
    eraLevel: 1,
    techs: {
      agriculture: {
        name: "Земледелие",
        icon: "🌾",
        time: 20,
        requires: ["hunting"],
        effects: { food_per_sec: 0.3, population_growth: 0.05 },
        description: "Систематическое выращивание растений"
      },
      writing: {
        name: "Письменность",
        icon: "📜",
        time: 25,
        requires: ["fire"],
        effects: { science_per_sec: 0.2 },
        description: "Развитие письменности и учёта"
      },
      bronze: {
        name: "Бронза",
        icon: "🛡️",
        time: 30,
        requires: ["mining"],
        effects: { production_per_sec: 0.2, military_strength: 1.5 },
        description: "Обработка бронзы для оружия"
      },
      pottery: {
        name: "Керамика",
        icon: "🏺",
        time: 20,
        requires: ["agriculture"],
        effects: { gold_per_sec: 0.1 },
        description: "Изготовление керамических изделий"
      },
      wheel: {
        name: "Колесо",
        icon: "⚙️",
        time: 25,
        requires: ["agriculture"],
        effects: { production_per_sec: 0.15, trade_capacity: 1.2 },
        description: "Изобретение колеса"
      },
      mathematics: {
        name: "Математика",
        icon: "🔢",
        time: 30,
        requires: ["writing"],
        effects: { science_per_sec: 0.15 },
        description: "Основы математических наук"
      }
    }
  },

  // ============ СРЕДНЕВЕКОВЬЕ ============
  medieval: {
    era: "Средневековье",
    eraLevel: 2,
    techs: {
      feudalism: {
        name: "Феодализм",
        icon: "👑",
        time: 40,
        requires: ["bronze"],
        effects: { population_growth: 0.1, military_strength: 2.0 },
        description: "Феодальная система управления"
      },
      iron: {
        name: "Железо",
        icon: "🔨",
        time: 45,
        requires: ["bronze"],
        effects: { production_per_sec: 0.3, military_strength: 2.5 },
        description: "Выплавка и обработка железа"
      },
      education: {
        name: "Образование",
        icon: "📚",
        time: 50,
        requires: ["writing", "mathematics"],
        effects: { science_per_sec: 0.3 },
        description: "Система образования"
      },
      theology: {
        name: "Теология",
        icon: "⛪",
        time: 45,
        requires: ["writing"],
        effects: { faith_per_sec: 0.2, happiness: 0.1 },
        description: "Развитие религиозных учений"
      },
      architecture: {
        name: "Архитектура",
        icon: "🏰",
        time: 50,
        requires: ["iron", "mathematics"],
        effects: { building_efficiency: 1.3, city_defense: 1.5 },
        description: "Продвинутое строительство"
      },
      banking: {
        name: "Банкинг",
        icon: "💳",
        time: 40,
        requires: ["pottery"],
        effects: { gold_per_sec: 0.3, trade_capacity: 1.5 },
        description: "Банковская система"
      },
      cavalry: {
        name: "Кавалерия",
        icon: "🐴",
        time: 45,
        requires: ["iron", "feudalism"],
        effects: { military_strength: 3.0, military_speed: 1.5 },
        description: "Обучение конных боевых единиц"
      }
    }
  },

  // ============ РЕНЕССАНС ============
  renaissance: {
    era: "Ренессанс",
    eraLevel: 3,
    techs: {
      printing: {
        name: "Книгопечатание",
        icon: "📖",
        time: 60,
        requires: ["education"],
        effects: { science_per_sec: 0.4, culture_per_sec: 0.2 },
        description: "Печать книг на станках"
      },
      gunpowder: {
        name: "Порох",
        icon: "💥",
        time: 70,
        requires: ["iron", "chemistry"],
        effects: { military_strength: 4.0, city_defense: 2.5 },
        description: "Создание пороха и огнестрельного оружия"
      },
      chemistry: {
        name: "Химия",
        icon: "🧪",
        time: 65,
        requires: ["mathematics", "theology"],
        effects: { science_per_sec: 0.3, production_per_sec: 0.2 },
        description: "Развитие химических наук"
      },
      navigation: {
        name: "Навигация",
        icon: "🧭",
        time: 60,
        requires: ["mathematics", "wheel"],
        effects: { trade_capacity: 2.0, exploration_speed: 1.5 },
        description: "Морская навигация и картография"
      },
      art: {
        name: "Искусство",
        icon: "🎨",
        time: 55,
        requires: ["education", "banking"],
        effects: { culture_per_sec: 0.3, happiness: 0.15 },
        description: "Развитие искусства и культуры"
      },
      mechanics: {
        name: "Механика",
        icon: "⚙️",
        time: 65,
        requires: ["mathematics", "iron"],
        effects: { production_per_sec: 0.4, building_efficiency: 1.5 },
        description: "Основы механики"
      }
    }
  },

  // ============ ПРОМЫШЛЕННОСТЬ ============
  industrial: {
    era: "Промышленность",
    eraLevel: 4,
    techs: {
      steam: {
        name: "Паровая энергия",
        icon: "🚂",
        time: 100,
        requires: ["chemistry", "mechanics"],
        effects: { production_per_sec: 0.8, trade_capacity: 3.0 },
        description: "Использование пара в производстве"
      },
      electricity: {
        name: "Электричество",
        icon: "⚡",
        time: 120,
        requires: ["steam"],
        effects: { production_per_sec: 1.0, science_per_sec: 0.5 },
        description: "Генерация и использование электричества"
      },
      industrialization: {
        name: "Индустриализация",
        icon: "🏭",
        time: 110,
        requires: ["steam", "mechanics"],
        effects: { production_per_sec: 1.2, population_growth: 0.2 },
        description: "Промышленное производство"
      },
      rifle: {
        name: "Винтовка",
        icon: "🔫",
        time: 90,
        requires: ["gunpowder", "steam"],
        effects: { military_strength: 6.0 },
        description: "Нарезное огнестрельное оружие"
      },
      railroad: {
        name: "Железная дорога",
        icon: "🚂",
        time: 100,
        requires: ["steam", "industrialization"],
        effects: { trade_capacity: 4.0, movement_speed: 2.0 },
        description: "Сеть железных дорог"
      },
      scientific_method: {
        name: "Научный метод",
        icon: "🔬",
        time: 100,
        requires: ["chemistry", "mechanics"],
        effects: { science_per_sec: 0.6, tech_speed: 1.2 },
        description: "Применение научного метода"
      }
    }
  },

  // ============ ИНФОРМАЦИОННАЯ ЭРА ============
  information: {
    era: "Информационная эра",
    eraLevel: 5,
    techs: {
      computer: {
        name: "Компьютеры",
        icon: "💻",
        time: 150,
        requires: ["electricity", "scientific_method"],
        effects: { science_per_sec: 1.0, tech_speed: 1.5 },
        description: "Развитие вычислительных машин"
      },
      internet: {
        name: "Интернет",
        icon: "🌐",
        time: 150,
        requires: ["computer"],
        effects: { trade_capacity: 5.0, science_per_sec: 0.8, culture_per_sec: 0.5 },
        description: "Глобальная сеть связи"
      },
      nuclear: {
        name: "Ядерная энергия",
        icon: "☢️",
        time: 180,
        requires: ["electricity", "scientific_method"],
        effects: { production_per_sec: 2.0, military_strength: 10.0 },
        description: "Использование ядерной энергии"
      },
      genetics: {
        name: "Генетика",
        icon: "🧬",
        time: 160,
        requires: ["scientific_method"],
        effects: { science_per_sec: 1.2, food_per_sec: 0.5, population_growth: 0.3 },
        description: "Генетические исследования"
      },
      robotics: {
        name: "Робототехника",
        icon: "🤖",
        time: 170,
        requires: ["computer", "industrialization"],
        effects: { production_per_sec: 2.5, building_efficiency: 2.0 },
        description: "Создание автоматических устройств"
      },
      space_travel: {
        name: "Космонавтика",
        icon: "🚀",
        time: 200,
        requires: ["nuclear", "computer"],
        effects: { science_per_sec: 1.5, culture_per_sec: 0.5 },
        description: "Путешествие в космос"
      },
      ai: {
        name: "Искусственный интеллект",
        icon: "🧠",
        time: 250,
        requires: ["computer", "robotics"],
        effects: { science_per_sec: 2.0, production_per_sec: 2.0, tech_speed: 2.0 },
        description: "Разработка ИИ"
      }
    }
  }
};

// Получить все технологии
function getAllTechs() {
  const all = {};
  Object.values(TECH_TREE).forEach(era => {
    Object.entries(era.techs).forEach(([key, tech]) => {
      all[key] = { ...tech, id: key, era: era.era };
    });
  });
  return all;
}

// Получить технологии эпохи
function getTechsByEra(eraLevel) {
  for (const [key, era] of Object.entries(TECH_TREE)) {
    if (era.eraLevel === eraLevel) {
      return era;
    }
  }
  return null;
}

// Проверить может ли быть исследована технология
function canResearchTech(techId, playerTechs) {
  const allTechs = getAllTechs();
  const tech = allTechs[techId];
  
  if (!tech) return false;
  
  // Проверяем требования
  for (const required of tech.requires) {
    if (!playerTechs.includes(required)) {
      return false;
    }
  }
  
  return true;
}

// Получить стоимость времени технологии
function getTechTime(techId) {
  const allTechs = getAllTechs();
  return allTechs[techId]?.time || 0;
}

module.exports = {
  TECH_TREE,
  getAllTechs,
  getTechsByEra,
  canResearchTech,
  getTechTime
};
