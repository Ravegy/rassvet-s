document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;

    // --- УВЕДОМЛЕНИЯ ---
    function showNotification(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    // --- КОРЗИНА: Логика ---
    let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || [];

    // Главная функция обновления всего UI
    function updateCartUI() {
        const widget = document.getElementById('cartWidget');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const orderBtn = document.getElementById('cartOrderBtn');
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if(widget) widget.textContent = `Корзина: ${totalItems}`;
        
        if(cartItems) {
            cartItems.innerHTML = '';
            let totalMoney = 0;

            cart.forEach((item, index) => {
                const priceNum = parseFloat(item.price.replace(/\s/g, '').replace('₽','').replace(',', '.')) || 0;
                totalMoney += priceNum * item.quantity;
                
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-item-info">
                        <span class="cart-item-title">${item.sku} - ${item.name}</span>
                        <span class="cart-item-price">${item.price}</span>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                        <span class="qty-count">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="btn-remove" onclick="removeCartItem(${index})">&times;</button>
                `;
                cartItems.appendChild(div);
            });
            
            if(cartTotal) cartTotal.textContent = `Итого: ${new Intl.NumberFormat('ru-RU').format(totalMoney)} ₽`;
            
            if(orderBtn) {
                let msg = "Здравствуйте! Хочу оформить заказ:%0A";
                cart.forEach(item => {
                    msg += `- ${item.sku} ${item.name} — ${item.quantity} шт. (${item.price})%0A`;
                });
                msg += `%0AИтого: ${new Intl.NumberFormat('ru-RU').format(totalMoney)} ₽`;
                orderBtn.href = `https://wa.me/${SITE_CONFIG.phone}?text=${msg}`;
            }
        }
        localStorage.setItem('rassvet_cart', JSON.stringify(cart));
        
        // ВАЖНО: Синхронизируем кнопки на карточках товаров
        syncButtonsWithCart();
    }

    // Функция синхронизации кнопок на странице с состоянием корзины
    function syncButtonsWithCart() {
        // Ищем все товары, у которых есть контейнеры кнопок
        const allProductCards = document.querySelectorAll('[data-product-id]');
        
        allProductCards.forEach(card => {
            const id = card.getAttribute('data-product-id');
            const cartItem = cart.find(item => item.id === id);
            
            const btnAdd = document.getElementById(`btn-add-${id}`);
            const btnQty = document.getElementById(`btn-qty-${id}`);
            const countSpan = document.getElementById(`qty-val-${id}`);

            if (btnAdd && btnQty && countSpan) {
                if (cartItem) {
                    // Товар в корзине: показываем +/-
                    btnAdd.classList.add('hidden');
                    btnQty.classList.remove('hidden');
                    countSpan.textContent = cartItem.quantity;
                } else {
                    // Товара нет: показываем кнопку "В корзину"
                    btnAdd.classList.remove('hidden');
                    btnQty.classList.add('hidden');
                }
            }
        });
    }

    // Обработчики модального окна
    const modal = document.getElementById('cartModal');
    const widget = document.getElementById('cartWidget');
    const close = document.getElementById('closeCart');
    
    if(widget) widget.onclick = () => { modal.style.display = 'flex'; updateCartUI(); };
    if(close) close.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; };

    // === ГЛОБАЛЬНЫЕ ФУНКЦИИ (доступны из HTML) ===

    // 1. Добавить новый товар (кнопка "В КОРЗИНУ")
    window.addToCart = (id, sku, name, price) => {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({id, sku, name, price, quantity: 1});
            showNotification('Товар добавлен в корзину');
        }
        updateCartUI();
        
        // Анимация виджета
        const widgetBtn = document.getElementById('cartWidget');
        if(widgetBtn) {
             widgetBtn.style.transform = "scale(1.2)";
             setTimeout(() => widgetBtn.style.transform = "scale(1)", 200);
        }
    };

    // 2. Изменить кол-во товара из КАРТОЧКИ (маленькие кнопки +/-)
    window.updateItemQty = (id, delta) => {
        const item = cart.find(p => p.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                // Если стало 0, удаляем из корзины
                cart = cart.filter(p => p.id !== id);
            }
            updateCartUI();
        }
    };
    
    // 3. Изменить кол-во товара внутри МОДАЛКИ КОРЗИНЫ
    window.changeQuantity = (index, delta) => {
        const item = cart[index];
        item.quantity += delta;
        if (item.quantity <= 0) item.quantity = 1; 
        updateCartUI();
    };

    window.removeCartItem = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    // --- КАТАЛОГ ---
    let allProducts = [];
    let displayedCount = 0;
    let currentCategory = 'all';
    const itemsPerPage = SITE_CONFIG.itemsPerPage || 12;
    
    const catalogGrid = document.getElementById('catalog');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if(catalogGrid) {
        loadCatalogData();
    }

    function loadCatalogData() {
        const cacheKey = 'rassvet_v7_data'; 
        const timeKey = 'rassvet_v7_time';
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
        
        // После отрисовки обновляем кнопки
        updateCartUI(); 
    }

    if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
    if(searchInput) searchInput.addEventListener('input', () => renderBatch(true));

    function createCard(product) {
        let imgUrl = SITE_CONFIG.placeholderImage;
        if (product.image && product.image.trim()) {
            imgUrl = product.image.startsWith('http') ? product.image : `images/parts/${product.image}`;
        }
        
        const priceFmt = formatPrice(product.price);
        const nameClean = product.name.replace(/'/g, "");

        const card = document.createElement('div');
        card.className = 'product-card';
        // Добавляем атрибут, чтобы легко искать кнопку этого товара
        card.setAttribute('data-product-id', product.id);

        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imgUrl}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='${SITE_CONFIG.placeholderImage}'">
            </div>
            <div class="product-sku">АРТ: ${product.sku}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-price">${priceFmt}</div>
            <div class="btn-group">
                <a href="product.html?id=${product.id}" class="btn-card btn-blue">Инфо</a>
                
                <button id="btn-add-${product.id}" 
                        onclick="addToCart('${product.id}', '${product.sku}', '${nameClean}', '${priceFmt}')" 
                        class="btn-card btn-green">
                    В КОРЗИНУ
                </button>

                <div id="btn-qty-${product.id}" class="btn-qty-grid hidden">
                    <button onclick="updateItemQty('${product.id}', -1)">-</button>
                    <span id="qty-val-${product.id}">1</span>
                    <button onclick="updateItemQty('${product.id}', 1)">+</button>
                </div>
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