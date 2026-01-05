document.addEventListener('DOMContentLoaded', () => {
    // Если конфига нет, ничего не делаем
    if (typeof SITE_CONFIG === 'undefined') return;

    let allProducts = [];
    let displayedCount = 0;
    let currentCategory = 'all';
    const itemsPerPage = SITE_CONFIG.itemsPerPage || 12;
    
    // Получаем элементы
    const catalogGrid = document.getElementById('catalog');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    // Запуск
    initSite();

    function initSite() {
        fillContacts();
        loadCatalogData();
    }

    // Заполнение контактов
    function fillContacts() {
        const els = {
            hp: document.getElementById('headerPhone'),
            fp: document.getElementById('footerPhone'),
            fe: document.getElementById('footerEmail')
        };
        if(els.hp) { els.hp.textContent = SITE_CONFIG.displayPhone; els.hp.href = `tel:+${SITE_CONFIG.phone}`; }
        if(els.fp) { els.fp.textContent = SITE_CONFIG.displayPhone; els.fp.href = `tel:+${SITE_CONFIG.phone}`; }
        if(els.fe) { els.fe.textContent = SITE_CONFIG.email; els.fe.href = `mailto:${SITE_CONFIG.email}`; }
    }

    // Загрузка данных
    function loadCatalogData() {
        // Ключи для кэша
        const cacheKey = 'rassvet_v4_data';
        const timeKey = 'rassvet_v4_time';
        const maxAge = (SITE_CONFIG.cacheTime || 60) * 60 * 1000;
        
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);
        const now = Date.now();

        // 1. Пробуем загрузить из кэша
        if (cachedData && cachedTime && (now - cachedTime < maxAge)) {
            allProducts = JSON.parse(cachedData);
            initCategories(allProducts);
            // Передаем true, чтобы сбросить лоадер
            renderBatch(true); 
        } else {
            // 2. Если нет в кэше, грузим из сети
            fetch(SITE_CONFIG.sheetUrl)
                .then(res => res.text())
                .then(csvText => {
                    if (csvText.includes("<!DOCTYPE html>")) throw new Error("Таблица закрыта");
                    
                    const rows = parseCSV(csvText);
                    rows.shift(); // Убираем заголовки
                    
                    allProducts = rows.map(row => {
                        if (!row[0]) return null;
                        return {
                            id: row[0],
                            sku: row[1] ? row[1].trim() : '',
                            name: row[2],
                            price: row[3],
                            category: row[4] ? row[4].trim() : 'Другое',
                            image: row[5],
                            desc: row[6]
                        };
                    }).filter(p => p !== null && p.name);

                    // Сохраняем в кэш
                    localStorage.setItem(cacheKey, JSON.stringify(allProducts));
                    localStorage.setItem(timeKey, Date.now());
                    
                    initCategories(allProducts);
                    renderBatch(true); // Сброс лоадера
                })
                .catch(err => {
                    console.error(err);
                    catalogGrid.innerHTML = `
                        <div class="loader-container">
                            <h3 style="color:#ff6b6b">Ошибка загрузки</h3>
                            <p>Проверьте подключение к интернету или ID таблицы</p>
                        </div>`;
                });
        }
    }

    // Создание кнопок категорий
    function initCategories(products) {
        if(!categoryFilter) return;
        const cats = ['Все', ...new Set(products.map(p => p.category).filter(c => c))];
        categoryFilter.innerHTML = '';
        cats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = cat === 'Все' ? 'cat-btn active' : 'cat-btn';
            btn.textContent = cat;
            btn.onclick = () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = cat === 'Все' ? 'all' : cat;
                renderBatch(true); // При смене категории сбрасываем сетку
            };
            categoryFilter.appendChild(btn);
        });
    }

    // Отрисовка товаров
    function renderBatch(reset = false) {
        if (reset) {
            catalogGrid.innerHTML = ''; // 🔥 ВОТ ТУТ МЫ УДАЛЯЕМ НАДПИСЬ "ЗАГРУЗКА"
            displayedCount = 0;
            loadMoreContainer.style.display = 'none';
        }

        const searchVal = searchInput.value.toLowerCase();
        
        // Фильтрация
        const filtered = allProducts.filter(p => {
            const matchesCat = currentCategory === 'all' || p.category === currentCategory;
            const matchesSearch = !searchVal || p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            catalogGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#ccc;">Товары не найдены</div>';
            return;
        }

        // Пагинация
        const nextBatch = filtered.slice(displayedCount, displayedCount + itemsPerPage);
        
        nextBatch.forEach(product => {
            catalogGrid.appendChild(createCard(product));
        });

        displayedCount += nextBatch.length;
        
        // Кнопка "Показать ещё"
        if (displayedCount < filtered.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    // Слушатели событий
    if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
    if(searchInput) searchInput.addEventListener('input', () => renderBatch(true));

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
                <img src="${imgUrl}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='${SITE_CONFIG.placeholderImage}'">
            </div>
            <div class="product-sku">АРТ: ${product.sku}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="btn-group">
                <a href="product.html?id=${product.id}" class="btn-card btn-blue">Инфо</a>
                <a href="https://wa.me/${SITE_CONFIG.phone}?text=${SITE_CONFIG.waDefaultMessage} ${product.sku}" target="_blank" class="btn-card btn-green">Купить</a>
            </div>
        `;
        return card;
    }

    function formatPrice(price) {
        if (!price) return 'По запросу';
        const clean = parseFloat(price.replace(/\s/g, '').replace(',', '.'));
        return isNaN(clean) ? price : new Intl.NumberFormat('ru-RU').format(clean) + ' ₽';
    }

    function parseCSV(text) {
        const result = []; let row = []; let inQuote = false; let cell = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) { row.push(cell); cell = ''; }
            else if ((char === '\r' || char === '\n') && !inQuote) {
                if (cell || row.length > 0) row.push(cell);
                if (row.length > 0) result.push(row);
                row = []; cell = ''; if (char === '\r' && text[i+1] === '\n') i++;
            } else cell += char;
        }
        if (cell || row.length > 0) { row.push(cell); result.push(row); }
        return result;
    }
});