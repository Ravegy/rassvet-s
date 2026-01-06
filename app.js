// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ФУНКЦИИ
// ==========================================
let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || [];

// 1. РЕНДЕРИНГ ИНТЕРФЕЙСА
function renderLayout() {
    const isContacts = window.location.pathname.includes('contacts.html');
    const isCatalog = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    const c = SITE_CONFIG.contacts; // Сокращение для удобства

    // Хелпер для скрытия пустых ссылок
    const showIf = (link) => link ? 'flex' : 'none';

    // ШАПКА
    const headerEl = document.querySelector('header');
    if (headerEl) {
        headerEl.className = 'header';
        headerEl.innerHTML = `
            <div class="container header-main">
                <button class="menu-btn" id="menuBtn">
                    <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <a href="index.html" class="logo-text"><h1>РАССВЕТ-С</h1></a>
                <nav class="header-nav" id="headerNav">
                    <a href="index.html" class="nav-link ${isCatalog ? 'active' : ''}">Каталог</a>
                    <a href="#" class="nav-link">О компании</a>
                    <a href="#" class="nav-link">Доставка и оплата</a>
                    <a href="contacts.html" class="nav-link ${isContacts ? 'active' : ''}">Контакты</a>
                </nav>
                <div class="header-contacts">
                    <div id="cartWidget" class="cart-widget">Корзина: 0</div>
                </div>
            </div>`;
    }

    // МОДАЛКИ
    if (!document.getElementById('cartModal')) {
        const globalComponents = document.createElement('div');
        globalComponents.innerHTML = `
            <div id="cartModal" class="cart-modal">
                <div class="cart-content">
                    <div class="cart-header"><h2>Ваша корзина</h2><span class="close-cart" id="closeCart">&times;</span></div>
                    <div class="cart-items" id="cartItems"></div>
                    <div class="cart-footer"><span id="cartTotal" class="cart-total">Итого: 0 ₽</span><button id="cartOrderBtn" class="btn-cart-order">Отправить запрос</button></div>
                </div>
            </div>
            <div id="orderModal" class="cart-modal" style="z-index: 2100;">
                <div class="cart-content">
                    <div class="cart-header"><h2>Оформление заказа</h2><span class="close-cart" id="closeOrder">&times;</span></div>
                    <form id="orderForm" class="order-form">
                        <div class="form-group"><input type="text" id="orderName" class="form-input" placeholder="Ваше Имя" required></div>
                        <div class="form-group"><input type="tel" id="orderPhone" class="form-input" placeholder="Номер телефона" required></div>
                        <div class="form-group"><input type="email" id="orderEmail" class="form-input" placeholder="Email (необязательно)"></div>
                        <button type="submit" class="btn-cart-order">Подтвердить заказ</button>
                    </form>
                </div>
            </div>
            <div id="toast-container"></div>
        `;
        document.body.appendChild(globalComponents);
    }

    // ПОДВАЛ (Динамический)
    const footerEl = document.querySelector('footer');
    if (footerEl) {
        footerEl.className = 'footer';
        footerEl.innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <div class="footer-col">
                        <h4>О компании</h4>
                        <p>ООО «РАССВЕТ-С» — надежный поставщик запчастей и комплектующих для лесозаготовительной техники Komatsu.</p>
                        <div class="footer-socials">
                            <a href="${c.telegram}" target="_blank" class="social-btn telegram" style="display: ${showIf(c.telegram)}" aria-label="Telegram"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
                            <a href="${c.whatsapp}" target="_blank" class="social-btn whatsapp" style="display: ${showIf(c.whatsapp)}" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></a>
                            <a href="${c.vk}" target="_blank" class="social-btn vk" style="display: ${showIf(c.vk)}" aria-label="VK"><svg viewBox="0 0 24 24"><path d="M13.162 18.994c.609 0 .858-.406.851-1.512-.006-1.72.784-2.527 1.522-2.527.676 0 1.568.658 1.948 2.378.109.493.502.593.74.593h2.324c.787 0 1.101-.392 1.135-.857.073-1.021-.924-2.527-2.384-3.527-.608-.415-.589-.728.061-1.391.821-.837 2.18-2.618 2.364-3.593.033-.175.039-.481-.225-.481h-2.338c-.732 0-.989.336-1.229.832-1.006 2.072-2.41 3.251-3.216 3.251-.274 0-.463-.158-.463-.889V8.407c0-1.211-.284-1.407-1.022-1.407h-2.18c-.378 0-.698.192-.698.593 0 .428.632.535.698 1.76v3.131c0 .693-.214.97-.681.97-.97 0-3.329-3.593-4.329-7.234-.163-.585-.438-.813-1.022-.813H2.887c-.773 0-.937.336-.937.679 0 .684.974 4.116 4.382 8.781C8.627 17.5 11.237 18.994 13.162 18.994z"/></svg></a>
                            <a href="${c.avito}" target="_blank" class="social-btn avito" style="display: ${showIf(c.avito)}" aria-label="Avito"><svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/></svg></a>
                        </div>
                    </div>
                    <div class="footer-col">
                        <h4>Навигация</h4>
                        <nav class="footer-nav">
                            <a href="index.html">Каталог</a>
                            <a href="#">О компании</a>
                            <a href="#">Доставка и оплата</a>
                            <a href="contacts.html">Контакты</a>
                        </nav>
                    </div>
                    <div class="footer-col">
                        <h4>Контакты</h4>
                        <div class="footer-contacts-list">
                            <div class="footer-contact-item">
                                <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
                                <div class="footer-contact-info"><span class="footer-contact-label">Телефон</span><a href="tel:${c.phoneLink}" class="footer-phone-big">${c.phoneDisplay}</a></div>
                            </div>
                            <div class="footer-contact-item">
                                <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
                                <div class="footer-contact-info"><span class="footer-contact-label">Email</span><a href="mailto:${c.email}" class="footer-link">${c.email}</a></div>
                            </div>
                            <div class="footer-contact-item">
                                <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                                <div class="footer-contact-info"><span class="footer-contact-label">Адрес склада</span><span style="color: #ccc; line-height: 1.4;">${c.address}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p class="footer-disclaimer">Данный сайт носит исключительно информационный характер и ни при каких условиях информационные материалы и цены, размещенные на сайте, не являются публичной офертой, определяемой положениями Статьи 437 Гражданского кодекса РФ.</p>
                </div>
            </div>`;
    }
}

// 2. УНИВЕРСАЛЬНЫЙ ЗАГРУЗЧИК ДАННЫХ
async function getCatalogData() {
    const cacheKey = 'rassvet_v7_data'; 
    const timeKey = 'rassvet_v7_time';
    const maxAge = (SITE_CONFIG.cacheTime || 1) * 60 * 60 * 1000;
    
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(timeKey);
    const now = Date.now();

    if (cachedData && cachedTime && (now - cachedTime < maxAge)) {
        return JSON.parse(cachedData);
    }

    try {
        const res = await fetch(SITE_CONFIG.sheetUrl);
        if (!res.ok) throw new Error('Network error');
        const csvText = await res.text();
        
        const rows = parseCSV(csvText); 
        rows.shift();
        
        const products = rows.map(row => {
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

        localStorage.setItem(cacheKey, JSON.stringify(products));
        localStorage.setItem(timeKey, now);
        
        return products;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return [];
    }
}

// 3. ХЕЛПЕРЫ (Debounce, Уведомления, Валидация)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

function parseCSV(text) { 
    const result = []; let row = []; let inQuote = false; let cell = ''; 
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

function formatPrice(price) { 
    if (!price) return 'По запросу'; 
    const clean = parseFloat(price.replace(/\s/g, '').replace(',', '.')); 
    return isNaN(clean) ? price : new Intl.NumberFormat('ru-RU').format(clean) + ' ₽'; 
}

function getImageUrl(imagePath) {
    if (!imagePath || !imagePath.trim()) return SITE_CONFIG.placeholderImage;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanName = imagePath.trim().replace(/^images\/parts\//, '').replace(/^parts\//, '').replace(/^\//, '');
    return `images/parts/${cleanName}`;
}

// 4. ИНИЦИАЛИЗАЦИЯ (DOM READY)
document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;
    
    renderLayout();
    window.updateCartUI();

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
    const orderModal = document.getElementById('orderModal');
    const closeOrder = document.getElementById('closeOrder');
    
    if(widget) widget.onclick = () => { modal.style.display = 'flex'; window.updateCartUI(); };
    if(close) close.onclick = () => { modal.style.display = 'none'; };
    if(closeOrder) closeOrder.onclick = () => { orderModal.style.display = 'none'; };
    if(orderBtn) {
        orderBtn.onclick = () => {
            if (cart.length === 0) { window.showNotification('Корзина пуста'); return; }
            modal.style.display = 'none';
            orderModal.style.display = 'flex';
        };
    }
    window.onclick = (e) => { 
        if(e.target == modal) modal.style.display = 'none'; 
        if(e.target == orderModal) orderModal.style.display = 'none';
    };

    const orderForm = document.getElementById('orderForm');
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
            if (!validateInput(nameInput, 'name') || !validateInput(phoneInput, 'phone') || !validateInput(emailInput, 'email')) return;
            
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

            sendOrderToTelegram(message, orderForm);
        };
    }

    // --- РОУТЕР ПО СТРАНИЦАМ ---

    // КАТАЛОГ
    const catalogGrid = document.getElementById('catalog');
    if(catalogGrid) {
        let allProducts = [];
        let displayedCount = 0;
        let currentCategory = 'all';
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');

        initCatalog();

        async function initCatalog() {
            try {
                allProducts = await getCatalogData();
                if (allProducts.length === 0) {
                    catalogGrid.innerHTML = '<div class="loader-container"><p class="error-text">Ошибка загрузки данных</p></div>';
                    return;
                }
                initCategories(allProducts);
                renderBatch(true);
            } catch (err) {
                console.error(err);
                catalogGrid.innerHTML = '<div class="loader-container"><p class="error-text">Ошибка сети</p></div>';
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
            const nextBatch = filtered.slice(displayedCount, displayedCount + SITE_CONFIG.itemsPerPage);
            nextBatch.forEach(product => { catalogGrid.appendChild(createCard(product)); });
            displayedCount += nextBatch.length;
            if(loadMoreContainer) loadMoreContainer.style.display = (displayedCount < filtered.length) ? 'block' : 'none';
            window.updateCartUI(); 
        }

        if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
        // Добавляем DEBOUNCE к поиску
        if(searchInput) searchInput.addEventListener('input', debounce(() => renderBatch(true), 300));

        function createCard(product) {
            const imgUrl = getImageUrl(product.image);
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
    }

    // СТРАНИЦА ТОВАРА
    const productDetail = document.getElementById('productDetail');
    if(productDetail) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (!productId) { productDetail.innerHTML = `<h2 style="text-align:center; color:#fff;">Товар не найден</h2>`; return; }
        
        initProductPage(productId);

        async function initProductPage(id) {
            try {
                const products = await getCatalogData();
                const product = products.find(p => p.id === id);
                if (product) { 
                    renderProduct(product); 
                    // МЕНЯЕМ ЗАГОЛОВОК СТРАНИЦЫ
                    document.title = `${product.name} | РАССВЕТ-С`;
                } 
                else { productDetail.innerHTML = `<h2 style="text-align:center; color:#fff;">Товар с ID ${id} не найден в базе</h2>`; }
            } catch (err) { console.error(err); productDetail.innerHTML = `<h2 style="text-align:center; color:#fff;">Ошибка загрузки данных</h2>`; }
        }

        function renderProduct(p) { 
            const imgUrl = getImageUrl(p.image);
            const priceFmt = formatPrice(p.price);
            const nameClean = p.name.replace(/'/g, "");
            const html = `
                <div class="product-full-card" data-product-id="${p.id}">
                    <div class="full-img-wrapper"><img src="${imgUrl}" alt="${p.name}" onerror="this.src='${SITE_CONFIG.placeholderImage}'"></div>
                    <div class="full-info">
                        <div class="full-sku">АРТИКУЛ: ${p.sku}</div>
                        <h1 class="full-title">${p.name}</h1>
                        <div class="full-price">${priceFmt}</div>
                        <div class="full-actions-group">
                            <a href="index.html" class="btn-detail blue">В КАТАЛОГ</a>
                            <button id="btn-add-${p.id}" onclick="addToCart('${p.id}', '${p.sku}', '${nameClean}', '${priceFmt}')" class="btn-detail green">В КОРЗИНУ</button>
                            <div id="btn-qty-${p.id}" class="btn-qty-grid hidden"><button onclick="updateItemQty('${p.id}', -1)">-</button><span id="qty-val-${p.id}">1</span><button onclick="updateItemQty('${p.id}', 1)">+</button></div>
                        </div>
                        <div class="full-desc"><strong>Описание:</strong><br>${p.desc || 'Описание отсутствует.'}<br><br><strong>Категория:</strong> ${p.category || '-'}</div>
                    </div>
                </div>`;
            productDetail.innerHTML = html;
            window.updateCartUI();
        }
    }

    // КОНТАКТЫ
    const contactForm = document.getElementById('contactPageForm');
    if(contactForm) {
        const nameInput = document.getElementById('contactName');
        const phoneInput = document.getElementById('contactPhone');
        
        if (window.IMask) { IMask(phoneInput, { mask: '+{7} (000) 000-00-00' }); }
        nameInput.addEventListener('input', () => validateInput(nameInput, 'name'));
        phoneInput.addEventListener('input', () => validateInput(phoneInput, 'phone'));

        contactForm.onsubmit = (e) => {
            e.preventDefault();
            if (!validateInput(nameInput, 'name') || !validateInput(phoneInput, 'phone')) return;

            const name = nameInput.value;
            const phone = phoneInput.value;
            const msg = document.getElementById('contactMessage').value;
            const fileInput = document.getElementById('contactFile');
            const file = fileInput.files[0];

            let text = `<b>📩 Сообщение (Контакты)!</b>\n\n<b>Имя:</b> ${name}\n<b>Телефон:</b> ${phone}\n<b>Сообщение:</b>\n${msg}`;
            
            sendContactToTelegram(text, file, contactForm);
        };
    }
});

function sendOrderToTelegram(text, form) {
    const url = `https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendMessage`;
    const params = { chat_id: SITE_CONFIG.tgChatId, text: text, parse_mode: 'HTML' };
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Отправка...'; btn.disabled = true;

    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) })
    .then(res => {
        if(res.ok) {
            cart = []; localStorage.setItem('rassvet_cart', JSON.stringify(cart));
            window.updateCartUI(); form.reset(); 
            document.getElementById('orderModal').style.display = 'none'; 
            window.showNotification("Заказ успешно отправлен!");
        } else alert("Ошибка отправки.");
    })
    .catch(() => alert("Ошибка сети."))
    .finally(() => { btn.textContent = originalText; btn.disabled = false; });
}

function sendContactToTelegram(text, file, form) {
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Отправка...'; btn.disabled = true;

    if (file) {
        const formData = new FormData();
        formData.append('chat_id', SITE_CONFIG.tgChatId);
        formData.append('caption', text);
        formData.append('parse_mode', 'HTML');
        formData.append('document', file);
        
        fetch(`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendDocument`, { method: 'POST', body: formData })
        .then(handleRes).catch(handleErr).finally(() => { btn.textContent = originalText; btn.disabled = false; });
    } else {
        fetch(`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendMessage`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ chat_id: SITE_CONFIG.tgChatId, text: text, parse_mode: 'HTML' }) 
        })
        .then(handleRes).catch(handleErr).finally(() => { btn.textContent = originalText; btn.disabled = false; });
    }

    function handleRes(res) { 
        if(res.ok) { window.showNotification("Сообщение отправлено!"); form.reset(); document.querySelectorAll('.success').forEach(el => el.classList.remove('success')); } 
        else { window.showNotification("Ошибка отправки."); } 
    }
    function handleErr() { window.showNotification("Ошибка сети."); }
}