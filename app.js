// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ФУНКЦИИ
// ==========================================
const TG_BOT_TOKEN = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o'; 
const TG_CHAT_ID = '1017718880';       

let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || [];

window.showNotification = function(message) {
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
};

window.updateCartUI = function() {
    const widget = document.getElementById('cartWidget');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
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
                <div class="cart-item-info"><span class="cart-item-title">${item.sku} - ${item.name}</span><span class="cart-item-price">${item.price}</span></div>
                <div class="qty-controls"><button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button><span class="qty-count">${item.quantity}</span><button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button></div>
                <button class="btn-remove" onclick="removeCartItem(${index})">&times;</button>
            `;
            cartItems.appendChild(div);
        });
        if(cartTotal) cartTotal.textContent = `Итого: ${new Intl.NumberFormat('ru-RU').format(totalMoney)} ₽`;
    }
    localStorage.setItem('rassvet_cart', JSON.stringify(cart));
    if (typeof window.syncButtonsWithCart === 'function') window.syncButtonsWithCart();
};

window.syncButtonsWithCart = function() {
    const allProductCards = document.querySelectorAll('[data-product-id]');
    allProductCards.forEach(card => {
        const id = card.getAttribute('data-product-id');
        const cartItem = cart.find(item => item.id === id);
        const btnAdd = document.getElementById(`btn-add-${id}`);
        const btnQty = document.getElementById(`btn-qty-${id}`);
        const countSpan = document.getElementById(`qty-val-${id}`);
        if (btnAdd && btnQty && countSpan) {
            if (cartItem) {
                btnAdd.classList.add('hidden');
                btnQty.classList.remove('hidden');
                countSpan.textContent = cartItem.quantity;
            } else {
                btnAdd.classList.remove('hidden');
                btnQty.classList.add('hidden');
            }
        }
    });
};

window.addToCart = function(id, sku, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) { existingItem.quantity++; } 
    else { cart.push({id, sku, name, price, quantity: 1}); window.showNotification('Товар добавлен в корзину'); }
    window.updateCartUI();
};

window.updateItemQty = function(id, delta) {
    const item = cart.find(p => p.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(p => p.id !== id);
        window.updateCartUI();
    }
};

window.changeQuantity = function(index, delta) {
    const item = cart[index];
    item.quantity += delta;
    if (item.quantity <= 0) item.quantity = 1; 
    window.updateCartUI();
};

window.removeCartItem = function(index) {
    cart.splice(index, 1);
    window.updateCartUI();
};

// Функция валидации
function validateInput(input, type) {
    const value = input.value.trim();
    let isValid = true;
    let msg = '';
    input.classList.remove('error', 'success');
    const parent = input.parentElement;
    let errorDiv = parent.querySelector('.error-message');
    if (!errorDiv) { errorDiv = document.createElement('div'); errorDiv.className = 'error-message'; parent.appendChild(errorDiv); }
    parent.classList.remove('has-error');

    if (type === 'name') {
        if (value.length < 2) { isValid = false; msg = 'Имя слишком короткое'; }
        else if (/[^a-zA-Zа-яА-ЯёЁ\s-]/.test(value)) { isValid = false; msg = 'Только буквы'; }
    } else if (type === 'phone') {
        if (value.length < 18) { isValid = false; msg = 'Введите полный номер'; }
    } else if (type === 'email') {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { isValid = false; msg = 'Некорректный Email'; }
    }

    if (!isValid) { input.classList.add('error'); parent.classList.add('has-error'); errorDiv.textContent = msg; }
    else if (value.length > 0) { input.classList.add('success'); }
    return isValid;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;
    window.updateCartUI();

    // --- МОБИЛЬНОЕ МЕНЮ (Логика Гамбургера) ---
    const menuBtn = document.getElementById('menuBtn');
    const headerNav = document.getElementById('headerNav');

    if (menuBtn && headerNav) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            headerNav.classList.toggle('active');
            const isOpen = headerNav.classList.contains('active');
            if (isOpen) {
                menuBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            } else {
                menuBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            }
        });
        document.addEventListener('click', (e) => {
            if (!headerNav.contains(e.target) && !menuBtn.contains(e.target) && headerNav.classList.contains('active')) {
                headerNav.classList.remove('active');
                menuBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            }
        });
    }

    const modal = document.getElementById('cartModal');
    const widget = document.getElementById('cartWidget');
    const close = document.getElementById('closeCart');
    const orderBtn = document.getElementById('cartOrderBtn');
    
    if(widget) widget.onclick = () => { modal.style.display = 'flex'; window.updateCartUI(); };
    if(close) close.onclick = () => { modal.style.display = 'none'; };
    if(orderBtn) {
        orderBtn.onclick = () => {
            if (cart.length === 0) { window.showNotification('Корзина пуста'); return; }
            document.getElementById('cartModal').style.display = 'none';
            document.getElementById('orderModal').style.display = 'flex';
        };
    }

    const orderModal = document.getElementById('orderModal');
    const closeOrder = document.getElementById('closeOrder');
    const orderForm = document.getElementById('orderForm');

    if(closeOrder) closeOrder.onclick = () => { orderModal.style.display = 'none'; };
    window.onclick = (e) => { 
        if(e.target == modal) modal.style.display = 'none'; 
        if(e.target == orderModal) orderModal.style.display = 'none';
    };

    if(orderForm) {
        const phoneInput = document.getElementById('orderPhone');
        const nameInput = document.getElementById('orderName');
        const emailInput = document.getElementById('orderEmail');

        if (phoneInput && window.IMask) IMask(phoneInput, { mask: '+{7} (000) 000-00-00' });
        if(nameInput) nameInput.addEventListener('input', () => validateInput(nameInput, 'name'));
        if(phoneInput) phoneInput.addEventListener('input', () => validateInput(phoneInput, 'phone'));
        if(emailInput) emailInput.addEventListener('input', () => validateInput(emailInput, 'email'));

        orderForm.onsubmit = (e) => {
            e.preventDefault();
            const isNameValid = validateInput(nameInput, 'name');
            const isPhoneValid = validateInput(phoneInput, 'phone');
            const isEmailValid = validateInput(emailInput, 'email');

            if (!isNameValid || !isPhoneValid || !isEmailValid) {
                orderForm.querySelector('.btn-cart-order').style.background = '#ff4444';
                setTimeout(() => orderForm.querySelector('.btn-cart-order').style.background = '', 300);
                return; 
            }
            
            const name = nameInput.value;
            const phone = phoneInput.value;
            const email = emailInput.value;

            let message = `<b>Новый заказ с сайта!</b>\n<b>Имя:</b> ${name}\n<b>Телефон:</b> ${phone}\n`;
            if(email) message += `<b>Email:</b> ${email}\n`;
            message += `\n<b>Состав заказа:</b>\n`;
            let totalMoney = 0;
            cart.forEach(item => {
                 const priceNum = parseFloat(item.price.replace(/\s/g, '').replace('₽','').replace(',', '.')) || 0;
                 totalMoney += priceNum * item.quantity;
                 message += `- ${item.sku} ${item.name} (x${item.quantity})\n`;
            });
            message += `\n<b>Сумма: ${new Intl.NumberFormat('ru-RU').format(totalMoney)} ₽</b>`;

            sendToTelegram(message);
        };
    }

    function sendToTelegram(text) {
        const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
        const params = { chat_id: TG_CHAT_ID, text: text, parse_mode: 'HTML' };
        const btn = orderForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Отправка...';
        btn.disabled = true;

        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) })
        .then(response => {
            if(response.ok) {
                cart = []; localStorage.setItem('rassvet_cart', JSON.stringify(cart));
                window.updateCartUI(); orderForm.reset(); orderModal.style.display = 'none'; 
                window.showNotification("Заказ успешно отправлен!");
            } else { alert("Ошибка отправки."); }
        })
        .catch(err => { console.error(err); alert("Ошибка сети."); })
        .finally(() => { btn.textContent = originalText; btn.disabled = false; });
    }

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

    if(catalogGrid) loadCatalogData();

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
            fetch(SITE_CONFIG.sheetUrl).then(res => res.text()).then(csvText => {
                const rows = parseCSV(csvText); rows.shift();
                allProducts = rows.map(row => {
                    if (!row[0]) return null;
                    return { id: row[0], sku: row[1] ? row[1].trim() : '', name: row[2], price: row[3], category: row[4] ? row[4].trim() : 'Другое', image: row[5], desc: row[6] };
                }).filter(p => p !== null && p.name);
                localStorage.setItem(cacheKey, JSON.stringify(allProducts));
                localStorage.setItem(timeKey, Date.now());
                initCategories(allProducts);
                renderBatch(true);
            }).catch(err => { if(catalogGrid) catalogGrid.innerHTML = '<div class="loader-container"><p class="error-text">Ошибка загрузки</p></div>'; });
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
        if (reset) { catalogGrid.innerHTML = ''; displayedCount = 0; loadMoreContainer.style.display = 'none'; }
        const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
        const filtered = allProducts.filter(p => {
            const matchesCat = currentCategory === 'all' || p.category === currentCategory;
            const matchesSearch = !searchVal || p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
            return matchesCat && matchesSearch;
        });
        if (filtered.length === 0) { catalogGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#ccc;">Товары не найдены</div>'; return; }
        const nextBatch = filtered.slice(displayedCount, displayedCount + itemsPerPage);
        nextBatch.forEach(product => { catalogGrid.appendChild(createCard(product)); });
        displayedCount += nextBatch.length;
        if(loadMoreContainer) loadMoreContainer.style.display = (displayedCount < filtered.length) ? 'block' : 'none';
        window.updateCartUI(); 
    }

    if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
    if(searchInput) searchInput.addEventListener('input', () => renderBatch(true));

    function createCard(product) {
        let imgUrl = SITE_CONFIG.placeholderImage;
        if (product.image && product.image.trim()) imgUrl = product.image.startsWith('http') ? product.image : `images/parts/${product.image}`;
        const priceFmt = formatPrice(product.price);
        const nameClean = product.name.replace(/'/g, "");
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product.id);
        card.innerHTML = `
            <div class="img-wrapper"><img src="${imgUrl}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='${SITE_CONFIG.placeholderImage}'"></div>
            <div class="product-sku">АРТ: ${product.sku}</div>
            <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
            <div class="product-price">${priceFmt}</div>
            <div class="btn-group">
                <a href="product.html?id=${product.id}" class="btn-card btn-blue">Подробнее</a>
                <button id="btn-add-${product.id}" onclick="addToCart('${product.id}', '${product.sku}', '${nameClean}', '${priceFmt}')" class="btn-card btn-green">В КОРЗИНУ</button>
                <div id="btn-qty-${product.id}" class="btn-qty-grid hidden"><button onclick="updateItemQty('${product.id}', -1)">-</button><span id="qty-val-${product.id}">1</span><button onclick="updateItemQty('${product.id}', 1)">+</button></div>
            </div>
        `;
        return card;
    }

    function formatPrice(price) { if (!price) return 'По запросу'; const clean = parseFloat(price.replace(/\s/g, '').replace(',', '.')); return isNaN(clean) ? price : new Intl.NumberFormat('ru-RU').format(clean) + ' ₽'; }
    function parseCSV(text) { const result = []; let row = []; let inQuote = false; let cell = ''; for (let i = 0; i < text.length; i++) { const char = text[i]; if (char === '"') inQuote = !inQuote; else if (char === ',' && !inQuote) { row.push(cell); cell = ''; } else if ((char === '\r' || char === '\n') && !inQuote) { if (cell || row.length > 0) row.push(cell); if (row.length > 0) result.push(row); row = []; cell = ''; if (char === '\r' && text[i+1] === '\n') i++; } else cell += char; } if (cell || row.length > 0) { row.push(cell); result.push(row); } return result; }
});