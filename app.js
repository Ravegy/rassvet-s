document.addEventListener('DOMContentLoaded', () => {
    // Проверка конфига
    if (typeof SITE_CONFIG === 'undefined') {
        console.error("Config not found!");
        return;
    }

    // --- ПЕРЕМЕННЫЕ ---
    let allProducts = [];
    let displayedCount = 0;
    const itemsPerPage = SITE_CONFIG.itemsPerPage || 12;
    
    // Элементы
    const catalogGrid = document.getElementById('catalog');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const searchInput = document.getElementById('searchInput');

    // --- ЗАПУСК ---
    initSite();

    function initSite() {
        fillContacts();     // Заполняем контакты
        loadCatalogData();  // Грузим товары (из кэша или сети)
    }

    // 1. ЗАПОЛНЕНИЕ КОНТАКТОВ
    function fillContacts() {
        // Шапка
        setText('headerPhone', SITE_CONFIG.displayPhone);
        setHref('headerPhone', `tel:+${SITE_CONFIG.phone}`);
        setText('headerEmail', SITE_CONFIG.email);
        setHref('headerEmail', `mailto:${SITE_CONFIG.email}`);

        // Подвал
        setText('footerPhone', SITE_CONFIG.displayPhone);
        setHref('footerPhone', `tel:+${SITE_CONFIG.phone}`);
        setText('footerEmail', SITE_CONFIG.email);
        setHref('footerEmail', `mailto:${SITE_CONFIG.email}`);
        setText('footerAddress', SITE_CONFIG.address);
        setText('footerWorkTime', SITE_CONFIG.workTime);
        setText('footerCompany', SITE_CONFIG.companyName);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el && text) el.textContent = text;
    }
    function setHref(id, link) {
        const el = document.getElementById(id);
        if (el && link) el.href = link;
    }

    // 2. ЗАГРУЗКА КАТАЛОГА (С КЭШЕМ)
    function loadCatalogData() {
        const cacheKey = 'rassvet_products';
        const timeKey = 'rassvet_time';
        
        // Проверяем кэш
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);
        const now = Date.now();
        const maxAge = (SITE_CONFIG.cacheTime || 60) * 60 * 1000; // Минуты -> Миллисекунды

        // Если кэш есть и он свежий
        if (cachedData && cachedTime && (now - cachedTime < maxAge)) {
            console.log("🔥 Загрузка из кэша браузера");
            allProducts = JSON.parse(cachedData);
            renderBatch();
        } else {
            console.log("🌍 Загрузка из Google Таблицы...");
            fetchFromNetwork(cacheKey, timeKey);
        }
    }

    function fetchFromNetwork(cacheKey, timeKey) {
        fetch(SITE_CONFIG.sheetUrl)
            .then(res => {
                if (!res.ok) throw new Error("Ошибка сети");
                return res.text();
            })
            .then(csvText => {
                if (csvText.includes("<!DOCTYPE html>")) throw new Error("Таблица закрыта");
                
                const rows = parseCSV(csvText);
                rows.shift(); // Удаляем заголовки

                allProducts = rows.map(row => {
                    if (!row[0]) return null;
                    return {
                        id: row[0],
                        sku: row[1] ? row[1].trim() : '',
                        name: row[2],
                        price: row[3],
                        category: row[4],
                        image: row[5],
                        desc: row[6]
                    };
                }).filter(p => p !== null && p.name);

                // Сохраняем в память
                localStorage.setItem(cacheKey, JSON.stringify(allProducts));
                localStorage.setItem(timeKey, Date.now());

                renderBatch();
            })
            .catch(err => {
                console.error(err);
                showErrorState();
            });
    }

    // 3. ОТРИСОВКА (ПОРЦИЯМИ)
    function renderBatch(reset = false) {
        if (reset) {
            catalogGrid.innerHTML = '';
            displayedCount = 0;
            loadMoreContainer.style.display = 'none';
        }

        const total = allProducts.length;
        if (total === 0) {
            catalogGrid.innerHTML = '<h3 style="color:#fff; grid-column:1/-1; text-align:center;">Товары не найдены</h3>';
            return;
        }

        // Берем следующие N товаров
        const nextBatch = allProducts.slice(displayedCount, displayedCount + itemsPerPage);
        
        nextBatch.forEach(product => {
            const card = createCard(product);
            catalogGrid.appendChild(card);
        });

        displayedCount += nextBatch.length;

        // Показываем кнопку "Показать ещё", если есть что показывать
        if (displayedCount < total) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    // Клик по кнопке "Показать ещё"
    loadMoreBtn.addEventListener('click', () => {
        renderBatch();
    });

    // Создание HTML карточки
    function createCard(product) {
        let imgUrl = SITE_CONFIG.placeholderImage;
        if (product.image && product.image.trim()) {
            imgUrl = product.image.startsWith('http') ? product.image : `images/parts/${product.image}`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imgUrl}" alt="${product.name}" class="product-img" onerror="this.src='${SITE_CONFIG.placeholderImage}'">
            </div>
            <div class="product-sku">АРТИКУЛ: ${product.sku}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="btn-group">
                <a href="product.html?id=${product.id}" class="btn-card btn-blue">Инфо</a>
                <a href="https://wa.me/${SITE_CONFIG.phone}?text=${SITE_CONFIG.waDefaultMessage} ${product.sku}" target="_blank" class="btn-card btn-green">WhatsApp</a>
            </div>
        `;
        return card;
    }

    // 4. ОШИБКА (FALLBACK)
    function showErrorState() {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 40px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                <h3>Не удалось загрузить каталог</h3>
                <p>Возможно, проблема с соединением. Пожалуйста, свяжитесь с нами:</p>
                <br>
                <a href="tel:+${SITE_CONFIG.phone}" style="background:#fff; color:#000; padding:10px 20px; text-decoration:none; border-radius:20px; font-weight:bold;">Позвонить</a>
            </div>
        `;
    }

    // 5. ПОИСК
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        
        // Получаем полные данные из кэша (чтобы искать по всем, а не только видимым)
        const cached = JSON.parse(localStorage.getItem('rassvet_products'));
        
        if (!cached) return;

        // Если поиск пустой - сброс к начальному состоянию
        if (val === '') {
            allProducts = cached;
            renderBatch(true);
            return;
        }

        // Фильтруем
        allProducts = cached.filter(p => 
            (p.name && p.name.toLowerCase().includes(val)) || 
            (p.sku && p.sku.toLowerCase().includes(val))
        );
        
        // Показываем результаты поиска (все сразу, без пагинации)
        catalogGrid.innerHTML = '';
        allProducts.forEach(p => catalogGrid.appendChild(createCard(p)));
        loadMoreContainer.style.display = 'none'; // Прячем кнопку при поиске
    });

    function formatPrice(price) {
        if (!price) return 'По запросу';
        const clean = parseFloat(price.replace(/\s/g, '').replace(',', '.'));
        return isNaN(clean) ? price : new Intl.NumberFormat('ru-RU').format(clean) + ' ₽';
    }

    // Парсер CSV (учитывает кавычки)
    function parseCSV(text) {
        const result = [];
        let row = [];
        let inQuote = false;
        let cell = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) { row.push(cell); cell = ''; }
            else if ((char === '\r' || char === '\n') && !inQuote) {
                if (cell || row.length > 0) row.push(cell);
                if (row.length > 0) result.push(row);
                row = []; cell = '';
                if (char === '\r' && text[i+1] === '\n') i++;
            } else cell += char;
        }
        if (cell || row.length > 0) { row.push(cell); result.push(row); }
        return result;
    }
});