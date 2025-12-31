const productsData = [
    // --- ГИДРАВЛИКА ---
    { name: "Гидронасос основной K3V112", article: "KH-4420340", price: 154000, category: "Гидравлика", image: "chain.jpg" },
    { name: "Гидромотор хода (редуктор)", article: "KH-4420341", price: 120000, category: "Гидравлика", image: "chain.jpg" },
    { name: "Гидрораспределитель 12 секций", article: "KH-992012", price: 89000, category: "Гидравлика", image: "chain.jpg" },
    { name: "Гидроцилиндр стрелы", article: "KH-UC2044", price: 45000, category: "Гидравлика", image: "chain.jpg" },
    { name: "Гидроцилиндр рукояти", article: "KH-UC2045", price: 43500, category: "Гидравлика", image: "chain.jpg" },
    { name: "Гидроцилиндр ковша", article: "KH-UC2046", price: 38000, category: "Гидравлика", image: "chain.jpg" },
    { name: "Клапан предохранительный главный", article: "KH-RV-102", price: 12500, category: "Гидравлика", image: "chain.jpg" },
    { name: "Ремкомплект центрального сустава", article: "KH-SK-442", price: 8500, category: "Гидравлика", image: "chain.jpg" },
    { name: "Шланг РВД 1/2 L-1500", article: "KH-Hose-01", price: 3500, category: "Гидравлика", image: "chain.jpg" },
    { name: "Поворотный круг (подшипник)", article: "KH-SW-450", price: 215000, category: "Гидравлика", image: "chain.jpg" },

    // --- ДВИГАТЕЛЬ ---
    { name: "Поршневая группа в сборе", article: "ED-6D102-K", price: 45800, category: "Двигатель", image: "chain.jpg" },
    { name: "Турбокомпрессор HX35W", article: "ED-HX35W", price: 67200, category: "Двигатель", image: "chain.jpg" },
    { name: "Коленчатый вал (стандарт)", article: "ED-CR-900", price: 112000, category: "Двигатель", image: "chain.jpg" },
    { name: "Стартер 24V 7.5kW", article: "ED-ST-24V", price: 24500, category: "Двигатель", image: "chain.jpg" },
    { name: "Генератор 60A", article: "ED-ALT-60", price: 19800, category: "Двигатель", image: "chain.jpg" },
    { name: "Форсунка топливная CR", article: "ED-0445120", price: 32400, category: "Двигатель", image: "chain.jpg" },
    { name: "ТНВД (топливный насос)", article: "ED-Pump-Fuel", price: 95000, category: "Двигатель", image: "chain.jpg" },
    { name: "Водяная помпа (насос)", article: "ED-WP-673", price: 9800, category: "Двигатель", image: "chain.jpg" },

    // --- РАСХОДНИКИ ---
    { name: "Фильтр масляный основной", article: "RS-LF-3349", price: 1250, category: "Расходники", image: "chain.jpg" },
    { name: "Фильтр топливный тонкий", article: "RS-BF-1212", price: 1850, category: "Расходники", image: "chain.jpg" },
    { name: "Фильтр воздушный (комплект)", article: "RS-AF-2513", price: 4600, category: "Расходники", image: "chain.jpg" },
    { name: "Коронка ковша усиленная", article: "RS-205-70-19570", price: 3400, category: "Расходники", image: "chain.jpg" },
    { name: "Болт коронки с гайкой", article: "RS-B-205", price: 480, category: "Расходники", image: "chain.jpg" },

    // --- ХОДОВАЯ ЧАСТЬ ---
    { name: "Каток опорный однобортный", article: "UC-BER-110", price: 12600, category: "Ходовая часть", image: "chain.jpg" },
    { name: "Каток поддерживающий", article: "UC-BER-220", price: 8500, category: "Ходовая часть", image: "chain.jpg" },
    { name: "Звездочка ведущая (сегмент)", article: "UC-SP-33", price: 18200, category: "Ходовая часть", image: "chain.jpg" },
    { name: "Цепь гусеничная (45 звеньев)", article: "UC-CH-45", price: 145000, category: "Ходовая часть", image: "chain.jpg" },

    // --- ЭЛЕКТРИКА ---
    { name: "Датчик давления масла", article: "EL-PS-01", price: 4900, category: "Электрика", image: "chain.jpg" },
    { name: "Датчик частоты вращения", article: "EL-RS-02", price: 5300, category: "Электрика", image: "chain.jpg" },
    { name: "Фара LED рабочая", article: "EL-LED-50", price: 3850, category: "Электрика", image: "chain.jpg" },
    { name: "Монитор управления кабины", article: "EL-DISP-100", price: 78500, category: "Электрика", image: "chain.jpg" },
    { name: "Контроллер двигателя (ЭБУ)", article: "EL-ECU-200", price: 168000, category: "Электрика", image: "chain.jpg" }
];

// Автоматическое дополнение до ровно 200 позиций с картинкой chain.jpg
const categories = ["Гидравлика", "Двигатель", "Расходники", "Ходовая часть", "Электрика"];
const startCount = productsData.length;

for (let i = startCount; i < 200; i++) {
    const cat = categories[i % categories.length];
    productsData.push({
        name: `Запчасть ${cat} (модель №${i + 1})`,
        article: `RSV-${2000 + i}`,
        price: Math.floor(Math.random() * (50000 - 1000) + 1000),
        category: cat,
        image: "chain.jpg"
    });
}

export default productsData;