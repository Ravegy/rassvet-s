document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;

    // --- КОРЗИНА: Логика ---
    let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || [];

    // Функция обновления интерфейса корзины
    function updateCartUI() {
        const widget = document.getElementById('cartWidget');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const orderBtn = document.getElementById('cartOrderBtn');
        
        // Обновляем виджет в шапке
        if(widget) widget.textContent = `Корзина: ${cart.length}`;
        
        // Обновляем список в модалке
        if(cartItems) {
            cartItems.innerHTML = '';
            let total = 0;
            cart.forEach((item, index) => {
                const priceNum = parseFloat(item.price.replace(/\s/g, '').replace('₽','').replace(',', '.')) || 0;
                total += priceNum;
                
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <span class="cart-item-title">${item.sku} - ${item.name}</span>
                    <span class="cart-item-price">${item.price}</span>
                    <button class="btn-remove" onclick="removeCartItem(${index})">&times;</button>
                `;
                cartItems.appendChild(div);
            });
            
            if(cartTotal) cartTotal.textContent = `Итого: ${new Intl.NumberFormat('ru-RU').format(total)} ₽`;
            
            // Формируем ссылку для WhatsApp
            if(orderBtn) {
                let msg = "Здравствуйте! Хочу оформить заказ:%0A";
                cart.forEach(item => {
                    msg += `- ${item.sku} ${item.name} (${item.price})%0A`;
                });
                msg += `%0AИтого: ${new Intl.NumberFormat('ru-RU').format(total)} ₽`;
                orderBtn.href = `https://wa.me/${SITE_CONFIG.phone}?text=${msg}`;
            }
        }
        // Сохраняем
        localStorage.setItem('rassvet_cart', JSON.stringify(cart));
    }

    // Обработчики модального окна
    const modal = document.getElementById('cartModal');
    const widget = document.getElementById('cartWidget');
    const close = document.getElementById('closeCart');
    
    if(widget) widget.onclick = () => { modal.style.display = 'flex'; updateCartUI(); };
    if(close) close.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; };

    // Глобальные функции (чтобы работали из onclick в HTML)
    window.addToCart = (id, sku, name, price) => {
        cart.push({id, sku, name, price});
        updateCartUI();
        // Небольшая визуальная обратная связь
        const widget = document.getElementById('cartWidget');
        widget.style.transform = "scale(1.2)";
        setTimeout(() => widget.style.transform = "scale(1)", 200);
    };
    
    window.removeCartItem = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    // Запускаем обновление при старте
    updateCartUI();


    // --- КАТАЛОГ: Логика ---
    let allProducts = [];
    let displayedCount = 0;
    let currentCategory = 'all';
    const itemsPerPage = SITE_CONFIG.itemsPerPage || 12;
    
    const catalogGrid = document.getElementById('catalog');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if(catalogGrid) initCatalog();

    function initCatalog() {
        loadCatalogData();
    }

    function loadCatalogData() {
        const cacheKey = 'rassvet_v6_data';
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
                    if(catalogGrid) catalogGrid.innerHTML = '<div class="loader-container"><p class="error-text">Ошибка загрузки</p></div>';
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

        const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
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
        if(loadMoreContainer) loadMoreContainer.style.display = (displayedCount < filtered.length) ? 'block' : 'none';
    }

    if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
    if(searchInput) searchInput.addEventListener('input', () => renderBatch(true));

    function createCard(product) {
        let imgUrl = SITE_CONFIG.placeholderImage;
        if (product.image && product.image.trim()) {
            imgUrl = product.image.startsWith('http') ? product.image : `images/parts/${product.image}`;
        }
        
        // Форматируем цену для передачи в функцию
        const priceFmt = formatPrice(product.price);
        const nameClean = product.name.replace(/'/g, ""); // Убираем кавычки из названия

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imgUrl}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='${SITE_CONFIG.placeholderImage}'">
            </div>
            <div class="product-sku">АРТ: ${product.sku}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-price">${priceFmt}</div>
            <div class="btn-group">
                <a href="product.html?id=${product.id}" class="btn-card btn-blue">Инфо</a>
                <button onclick="addToCart('${product.id}', '${product.sku}', '${nameClean}', '${priceFmt}')" class="btn-card btn-green">В КОРЗИНУ</button>
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