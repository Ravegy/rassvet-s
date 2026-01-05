document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;

    let allProducts = [];
    let displayedCount = 0;
    let currentCategory = 'all';
    const itemsPerPage = SITE_CONFIG.itemsPerPage || 12;
    
    const catalogGrid = document.getElementById('catalog');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    initSite();

    function initSite() {
        // Контакты уже в HTML, но на всякий случай обновляем, если нужно
        loadCatalogData();
    }

    function loadCatalogData() {
        const cacheKey = 'rassvet_v6_data'; // НОВЫЙ КЛЮЧ
        const timeKey = 'rassvet_v6_time';
        const maxAge = (SITE_CONFIG.cacheTime || 60) * 60 * 1000;
        
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);
        const now = Date.now();

        if (cachedData && cachedTime && (now - cachedTime < maxAge)) {
            allProducts = JSON.parse(cachedData);
            initCategories(allProducts);
            renderBatch(true);
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
                            category: row[4] ? row[4].trim() : 'Другое',
                            image: row[5],
                            desc: row[6]
                        };
                    }).filter(p => p !== null && p.name);

                    localStorage.setItem(cacheKey, JSON.stringify(allProducts));
                    localStorage.setItem(timeKey, Date.now());
                    
                    initCategories(allProducts);
                    renderBatch(true);
                })
                .catch(err => {
                    console.error(err);
                    catalogGrid.innerHTML = '<div class="loader-container"><p>Ошибка загрузки</p></div>';
                });
        }
    }

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
                renderBatch(true);
            };
            categoryFilter.appendChild(btn);
        });
    }

    function renderBatch(reset = false) {
        if (reset) {
            catalogGrid.innerHTML = '';
            displayedCount = 0;
            loadMoreContainer.style.display = 'none';
        }

        const searchVal = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => {
            const matchesCat = currentCategory === 'all' || p.category === currentCategory;
            const matchesSearch = !searchVal || p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            catalogGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#ccc;">Товары не найдены</div>';
            return;
        }

        const nextBatch = filtered.slice(displayedCount, displayedCount + itemsPerPage);
        
        nextBatch.forEach(product => {
            catalogGrid.appendChild(createCard(product));
        });

        displayedCount += nextBatch.length;
        loadMoreContainer.style.display = (displayedCount < filtered.length) ? 'block' : 'none';
    }

    if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
    if(searchInput) searchInput.addEventListener('input', () => renderBatch(true));

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