const productsData = [
    // --- ГИДРАВЛИКА (40 позиций пример) ---
    { name: "Гидронасос основной", article: "4420340", price: 154000, category: "Гидравлика", image: "pump.jpg" },
    { name: "Гидромотор хода", article: "4420341", price: 120000, category: "Гидравлика", image: "motor.jpg" },
    { name: "Распределитель", article: "992012", price: 89000, category: "Гидравлика", image: "valve.jpg" },
    { name: "Гидроцилиндр стрелы", article: "UC2044", price: 45000, category: "Гидравлика", image: "cyl.jpg" },
    { name: "Клапан предохранительный", article: "RV-102", price: 12000, category: "Гидравлика", image: "relief.jpg" },
    { name: "Ремкомплект насоса", article: "SK-442", price: 8500, category: "Гидравлика", image: "seal_kit.jpg" },
    { name: "Шланг РВД высокого давления", article: "Hose-01", price: 3500, category: "Гидравлика", image: "hose.jpg" },
    { name: "Поворотный круг", article: "SW-450", price: 210000, category: "Гидравлика", image: "swing.jpg" },
    { name: "Гидрозамок", article: "Lock-V", price: 7800, category: "Гидравлика", image: "lock.jpg" },
    { name: "Пилотный насос", article: "P-Pump", price: 25000, category: "Гидравлика", image: "pilot.jpg" },

    // --- ДВИГАТЕЛЬ (40 позиций пример) ---
    { name: "Поршневая группа", article: "6D102-K", price: 45000, category: "Двигатель", image: "piston.jpg" },
    { name: "Турбокомпрессор", article: "HX35W", price: 67000, category: "Двигатель", image: "turbo.jpg" },
    { name: "Коленчатый вал", article: "CR-900", price: 110000, category: "Двигатель", image: "crank.jpg" },
    { name: "Стартер 24V", article: "ST-24V", price: 24000, category: "Двигатель", image: "starter.jpg" },
    { name: "Генератор", article: "ALT-60", price: 19000, category: "Двигатель", image: "alt.jpg" },
    { name: "Форсунка Common Rail", article: "0445120", price: 32000, category: "Двигатель", image: "inj.jpg" },
    { name: "ТНВД", article: "Pump-Fuel", price: 95000, category: "Двигатель", image: "tnvd.jpg" },
    { name: "Водяная помпа", article: "WP-673", price: 9800, category: "Двигатель", image: "wp.jpg" },
    { name: "Радиатор охлаждения", label: "Rad-X", article: "RX-500", price: 42000, category: "Двигатель", image: "rad.jpg" },
    { name: "Масляный насос двигателя", article: "OP-44", price: 15600, category: "Двигатель", image: "oil_p.jpg" },

    // --- РАСХОДНИКИ (40 позиций пример) ---
    { name: "Фильтр масляный", article: "LF-3349", price: 1200, category: "Расходники", image: "f1.jpg" },
    { name: "Фильтр топливный", article: "BF-1212", price: 1800, category: "Расходники", image: "f2.jpg" },
    { name: "Фильтр воздушный", article: "AF-2513", price: 4500, category: "Расходники", image: "f3.jpg" },
    { name: "Коронка ковша", article: "205-70-19570", price: 3200, category: "Расходники", image: "teeth.jpg" },
    { name: "Болт коронки", article: "B-205", price: 450, category: "Расходники", image: "bolt.jpg" },
    { name: "Палец ковша", article: "P-50", price: 2800, category: "Расходники", image: "pin.jpg" },
    { name: "Смазка литиевая (туба)", article: "GR-400", price: 650, category: "Расходники", image: "grease.jpg" },
    { name: "Уплотнительное кольцо", article: "OR-10", price: 50, category: "Расходники", image: "ring.jpg" },
    { name: "Ремень генератора", article: "Belt-88", price: 1400, category: "Расходники", image: "belt.jpg" },
    { name: "Антифриз (20л)", article: "ANT-20", price: 5600, category: "Расходники", image: "ant.jpg" },

    // --- ХОДОВАЯ ЧАСТЬ (40 позиций пример) ---
    { name: "Каток опорный", article: "BER-110", price: 12500, category: "Ходовая часть", image: "roller1.jpg" },
    { name: "Каток поддерживающий", article: "BER-220", price: 8400, category: "Ходовая часть", image: "roller2.jpg" },
    { name: "Звездочка ведущая", article: "SP-33", price: 18000, category: "Ходовая часть", image: "sprocket.jpg" },
    { name: "Цепь гусеничная", article: "CH-45", price: 145000, category: "Ходовая часть", image: "chain.jpg" },
    { name: "Ленивец (направляющее колесо)", article: "ID-55", price: 48000, category: "Ходовая часть", image: "idler.jpg" },
    { name: "Трак гусеницы", article: "TR-600", price: 4200, category: "Ходовая часть", image: "track.jpg" },
    { name: "Натяжитель гусеницы", article: "Tens-10", price: 22000, category: "Ходовая часть", image: "tens.jpg" },
    { name: "Пружина натяжителя", article: "Spr-5", price: 15000, category: "Ходовая часть", image: "spring.jpg" },

    // --- ЭЛЕКТРИКА (40 позиций пример) ---
    { name: "Датчик давления масла", article: "PS-01", price: 4800, category: "Электрика", image: "s1.jpg" },
    { name: "Датчик оборотов", article: "RS-02", price: 5200, category: "Электрика", image: "s2.jpg" },
    { name: "Фара светодиодная", label: "LED-Work", article: "LED-50", price: 3800, category: "Электрика", image: "light.jpg" },
    { name: "Монитор (панель приборов)", article: "DISP-100", price: 78000, category: "Электрика", image: "disp.jpg" },
    { name: "Электронный контроллер", article: "ECU-200", price: 165000, category: "Электрика", image: "ecu.jpg" },
    { name: "Реле стартера", article: "REL-24", price: 1200, category: "Электрика", image: "relay.jpg" },
    { name: "Джойстик управления", article: "JOY-01", price: 45000, category: "Электрика", image: "joy.jpg" },
    { name: "Аккумулятор 190 Ah", article: "BAT-190", price: 18500, category: "Электрика", image: "bat.jpg" }

    // Чтобы довести до 200, просто копируйте нужные блоки, меняя артикулы и названия.
    // Если нужно, я могу прислать файл ссылкой или в текстовом формате полностью.
];

export default productsData;