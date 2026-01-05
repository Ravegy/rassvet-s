document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;

    let allProducts = [];
    let displayedCount = 0;
    let currentCategory = 'all'; // Текущая категория
    const itemsPerPage = SITE_CONFIG.itemsPerPage || 12;
    
    // Элементы
    const catalogGrid = document.getElementById('catalog');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    initSite();

    function initSite() {
        fillContacts();
        loadCatalogData();
    }

    // --- КОНТАКТЫ ---
    function fillContacts() {
        setText('headerPhone', SITE_CONFIG.displayPhone);
        setHref('headerPhone', `tel:+${SITE_CONFIG.phone}`);
        setText('headerEmail', SITE_CONFIG.email);
        setHref('headerEmail', `mailto:${SITE_CONFIG.email}`);
        setText('footerPhone', SITE_CONFIG.displayPhone);
        setHref('footerPhone', `tel:+${SITE_CONFIG.phone}`);
        setText('footerEmail', SITE_CONFIG.email);
        setHref('footerEmail', `mailto:${SITE_CONFIG.email}`);
        setText('footerAddress', SITE_CONFIG.address);
        setText('footerWorkTime', SITE_CONFIG.workTime);
        setText('footerCompany', SITE_CONFIG.companyName);
    }

    function setText(id, text) { const el = document.getElementById(id); if (el && text) el.textContent = text; }
    function setHref(id, link) { const el = document.getElementById(id); if (el && link) el.href = link; }

    // --- ЗАГРУЗКА ---
    function loadCatalogData() {
        const cacheKey = 'rassvet_products_v2'; // v2 для сброса кэша
        const timeKey = 'rassvet_time_v2';
        
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);
        const now = Date.now();
        const maxAge = (SITE_CONFIG.cacheTime || 60) * 60 * 1000;

        if (cachedData && cachedTime && (now - cachedTime < maxAge)) {
            allProducts = JSON.parse(cachedData);
            initCategories(allProducts); // Создаем кнопки категорий
            renderBatch();
        } else {
            fetch(SITE_CONFIG.sheetUrl)
                .then(res => res.text())
                .then(csvText => {
                    const rows = parseCSV(csvText);
                    rows.shift(); 
                    allProducts = rows.map(row => {
                        if (!row[0]) return null;
                        return {
                            id: row[0],
                            sku: row[1] ? row[1].trim() : '',
                            name: row[2],
                            price: row[3],
                            category: row[4] ? row[4].trim() : 'Другое', // Категория из 5 колонки
                            image: row[5],
                            desc: row[6]
                        };
                    }).filter(p => p !== null && p.name);

                    localStorage.setItem(cacheKey, JSON.stringify(allProducts));
                    localStorage.setItem(timeKey, Date.now());
                    
                    initCategories(allProducts);
                    renderBatch();
                })
                .catch(err => {
                    console.error(err);
                    catalogGrid.innerHTML = '<h3 style="color:#fff;">Ошибка загрузки. Обновите страницу.</h3>';
                });
        }
    }

    // --- КАТЕГОРИИ ---
    function initCategories(products) {
        if (!categoryFilter) return;
        
        // Собираем уникальные категории
        const cats = ['Все', ...new Set(products.map(p => p.category).filter(c => c))];
        
        categoryFilter.innerHTML = '';
        cats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = cat === 'Все' ? 'cat-btn active' : 'cat-btn';
            btn.textContent = cat;
            btn.onclick = () => {
                // Смена активной кнопки
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Фильтрация
                currentCategory = cat === 'Все' ? 'all' : cat;
                displayedCount = 0; // Сброс прокрутки
                renderBatch(true); // Перерисовка
            };
            categoryFilter.appendChild(btn);
        });
    }

    // --- ОТРИСОВКА ---
    function renderBatch(reset = false) {
        if (reset) {
            catalogGrid.innerHTML = '';
            displayedCount = 0;
            loadMoreContainer.style.display = 'none';
        }

        // Фильтрация по Категории И Поиску
        const searchVal = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => {
            const matchesCat = currentCategory === 'all' || p.category === currentCategory;
            const matchesSearch = !searchVal || p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            catalogGrid.innerHTML = '<h3 style="color:#fff; grid-column:1/-1; text-align:center;">Товары не найдены</h3>';
            return;
        }

        const nextBatch = filtered.slice(displayedCount, displayedCount + itemsPerPage);
        
        nextBatch.forEach(product => {
            catalogGrid.appendChild(createCard(product));
        });

        displayedCount += nextBatch.length;

        if (displayedCount < filtered.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    loadMoreBtn.addEventListener('click', () => renderBatch());

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
            <div class="product-sku">АРТ: ${product.sku}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="btn-group">
                <a href="product.html?id=${product.id}" class="btn-card btn-blue">Инфо</a>
                <a href="https://wa.me/${SITE_CONFIG.phone}?text=${SITE_CONFIG.waDefaultMessage} ${product.sku}" target="_blank" class="btn-card btn-green">WhatsApp</a>
            </div>
        `;
        return card;
    }

    searchInput.addEventListener('input', () => {
        displayedCount = 0;
        renderBatch(true);
    });

    function formatPrice(price) {
        if (!price) return 'По запросу';
        const clean = parseFloat(price.replace(/\s/g, '').replace(',', '.'));
        return isNaN(clean) ? price : new Intl.NumberFormat('ru-RU').format(clean) + ' ₽';
    }

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