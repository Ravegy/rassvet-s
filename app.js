// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ФУНКЦИИ
// ==========================================
let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || [];

// 1. РЕНДЕРИНГ ИНТЕРФЕЙСА
function renderLayout() {
    const path = window.location.pathname;
    const isActive = (page) => {
        if (page === 'index.html' && (path.endsWith('/') || path.includes('index.html'))) return 'active';
        return path.includes(page) ? 'active' : '';
    };
    const c = SITE_CONFIG.contacts; 
    const showIf = (link) => link ? 'flex' : 'none';

    // ШАПКА
    const headerEl = document.querySelector('header');
    if (headerEl) {
        headerEl.className = 'header';
        headerEl.innerHTML = `
            <div class="container header-main">
                <button class="menu-btn" id="menuBtn">
                    <svg viewBox="0 0 24 24" stroke="white" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <a href="index.html" class="logo-text"><h1>РАССВЕТ-С</h1></a>
                <nav class="header-nav" id="headerNav">
                    <a href="index.html" class="nav-link ${isActive('index.html')}">Каталог</a>
                    <a href="about.html" class="nav-link ${isActive('about.html')}">О компании</a>
                    <a href="delivery.html" class="nav-link ${isActive('delivery.html')}">Доставка</a>
                    <a href="contacts.html" class="nav-link ${isActive('contacts.html')}">Контакты</a>
                </nav>
                <div class="header-contacts">
                    <div id="cartWidget" class="cart-widget" onclick="openCart()">Корзина: 0</div>
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
            <div id="lightbox" class="lightbox" onclick="closeLightbox(event)">
                <span class="lightbox-close" onclick="closeLightbox(event)">&times;</span>
                <img class="lightbox-content" id="lightboxImg" onerror="this.src='https://placehold.co/600x400?text=Нет+фото'">
            </div>
            <div id="toast-container"></div>
        `;
        document.body.appendChild(globalComponents);
    }

    // ПОДВАЛ
    const footerEl = document.querySelector('footer');
    if (footerEl) {
        footerEl.className = 'footer';
        footerEl.innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <div class="footer-col">
                        <h4>О компании</h4>
                        <p>ООО «РАССВЕТ-С» — надежный поставщик запчастей.</p>
                        <div class="footer-socials">
                            <a href="${c.telegram}" target="_blank" class="social-btn telegram" style="display: ${showIf(c.telegram)}"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
                            <a href="${c.whatsapp}" target="_blank" class="social-btn whatsapp" style="display: ${showIf(c.whatsapp)}"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></a>
                        </div>
                    </div>
                    <div class="footer-col">
                        <h4>Контакты</h4>
                        <div class="footer-contacts-list">
                            <div class="footer-contact-item"><span class="footer-contact-label">Телефон</span><a href="tel:${c.phoneLink}" class="footer-phone-big">${c.phoneDisplay}</a></div>
                            <div class="footer-contact-item"><span class="footer-contact-label">Email</span><a href="mailto:${c.email}" class="footer-link">${c.email}</a></div>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p class="footer-disclaimer">Данный сайт носит информационный характер...</p>
                </div>
            </div>`;
    }
}

// 2. ОТКРЫТИЕ КОРЗИНЫ (ИСПРАВЛЕНО)
window.openCart = function() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'flex';
        window.updateCartUI();
    }
};

// 3. ЗАГРУЗКА И КАТАЛОГ
async function getCatalogData() {
    const cacheKey = 'rassvet_v7_data'; 
    const timeKey = 'rassvet_v7_time';
    const maxAge = (SITE_CONFIG.cacheTime || 1) * 60 * 60 * 1000;
    
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(timeKey);
    const now = Date.now();

    if (cachedData && cachedTime && (now - cachedTime < maxAge)) return JSON.parse(cachedData);

    try {
        const res = await fetch(SITE_CONFIG.sheetUrl);
        if (!res.ok) throw new Error('Network error');
        const csvText = await res.text();
        const rows = parseCSV(csvText); rows.shift();
        
        const products = rows.map(row => {
            if (!row[0]) return null;
            return { id: row[0], sku: row[1] ? row[1].trim() : '', name: row[2], price: row[3], category: row[4] ? row[4].trim() : 'Другое', image: row[5], desc: row[6] };
        }).filter(p => p !== null && p.name);

        localStorage.setItem(cacheKey, JSON.stringify(products));
        localStorage.setItem(timeKey, now);
        return products;
    } catch (error) { return []; }
}

// ХЕЛПЕРЫ
function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; }
function parsePrice(str) { if (!str) return 0; return parseFloat(str.replace(/\s/g, '').replace('₽', '').replace(',', '.')) || 0; }
window.showNotification = function(message) {
    const container = document.getElementById('toast-container'); if (!container) return;
    const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message;
    container.appendChild(toast); setTimeout(() => toast.classList.add('hiding'), 3000);
};
window.openLightbox = function(src) { document.getElementById('lightboxImg').src = src; document.getElementById('lightbox').classList.add('active'); };
window.closeLightbox = function(e) { if(e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) document.getElementById('lightbox').classList.remove('active'); };

window.updateCartUI = function() {
    const widget = document.getElementById('cartWidget'); const cartItems = document.getElementById('cartItems'); const cartTotal = document.getElementById('cartTotal');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); if(widget) widget.textContent = `Корзина: ${totalItems}`;
    if(cartItems) {
        cartItems.innerHTML = ''; let totalMoney = 0;
        cart.forEach((item, index) => {
            totalMoney += parsePrice(item.price) * item.quantity;
            cartItems.innerHTML += `<div class="cart-item"><div class="cart-item-info"><span class="cart-item-title">${item.sku} - ${item.name}</span><span class="cart-item-price">${item.price}</span></div><div class="qty-controls"><button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button><span class="qty-count">${item.quantity}</span><button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button></div><button class="btn-remove" onclick="removeCartItem(${index})">&times;</button></div>`;
        });
        if(cartTotal) cartTotal.textContent = `Итого: ${new Intl.NumberFormat('ru-RU').format(totalMoney)} ₽`;
    }
    localStorage.setItem('rassvet_cart', JSON.stringify(cart));
    if (typeof window.syncButtonsWithCart === 'function') window.syncButtonsWithCart();
};

window.syncButtonsWithCart = function() {
    document.querySelectorAll('[data-product-id]').forEach(card => {
        const id = card.getAttribute('data-product-id');
        const cartItem = cart.find(item => item.id === id);
        const btnAdd = document.getElementById(`btn-add-${id}`);
        const btnQty = document.getElementById(`btn-qty-${id}`);
        const countSpan = document.getElementById(`qty-val-${id}`);
        if (btnAdd && btnQty) {
            if (cartItem) { btnAdd.classList.add('hidden'); btnQty.classList.remove('hidden'); countSpan.textContent = cartItem.quantity; } 
            else { btnAdd.classList.remove('hidden'); btnQty.classList.add('hidden'); }
        }
    });
};

window.addToCart = function(id, sku, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity++; else { cart.push({id, sku, name, price, quantity: 1}); window.showNotification('Товар добавлен'); }
    window.updateCartUI();
};
window.updateItemQty = function(id, delta) { const item = cart.find(p => p.id === id); if(item) { item.quantity += delta; if(item.quantity<=0) cart = cart.filter(p=>p.id!==id); window.updateCartUI(); } };
window.changeQuantity = function(index, delta) { const item = cart[index]; item.quantity += delta; if(item.quantity<=0) item.quantity=1; window.updateCartUI(); };
window.removeCartItem = function(index) { cart.splice(index, 1); window.updateCartUI(); };

function parseCSV(text) { const r = []; let row = [], q = false, c = ''; for(let i=0; i<text.length; i++) { let ch = text[i]; if(ch==='"') q=!q; else if(ch===','&&!q) { row.push(c); c=''; } else if((ch==='\r'||ch==='\n')&&!q) { if(c||row.length) row.push(c); if(row.length) r.push(row); row=[]; c=''; } else c+=ch; } if(c||row.length) { row.push(c); r.push(row); } return r; }
function formatPrice(p) { if(!p) return 'По запросу'; const c = parseFloat(p.replace(/\s/g,'').replace(',','.')); return isNaN(c) ? p : new Intl.NumberFormat('ru-RU').format(c) + ' ₽'; }
function getImageUrl(path) { if(!path || !path.trim()) return SITE_CONFIG.placeholderImage; return path.startsWith('http') ? path : `images/parts/${path.trim().replace(/^images\/parts\//,'').replace(/^parts\//,'').replace(/^\//,'')}`; }

// 4. ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    if (typeof SITE_CONFIG === 'undefined') return;
    renderLayout();
    window.updateCartUI();

    // КНОПКА НАВЕРХ
    const btnUp = document.getElementById('btnUp');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) btnUp.classList.add('show'); else btnUp.classList.remove('show');
    });

    // БЛОКИРОВКА КОПИРОВАНИЯ
    document.addEventListener('contextmenu', event => { event.preventDefault(); window.showNotification('Копирование контента запрещено'); });
    document.addEventListener('keydown', event => {
        if (event.ctrlKey && (event.key === 'c' || event.key === 'u')) { event.preventDefault(); window.showNotification('Копирование запрещено'); }
    });
    document.body.classList.add('no-select');

    // ОБРАБОТЧИКИ МЕНЮ И МОДАЛОК
    const menuBtn = document.getElementById('menuBtn');
    const headerNav = document.getElementById('headerNav');
    if(menuBtn) { menuBtn.onclick = (e) => { e.stopPropagation(); headerNav.classList.toggle('active'); }; }
    
    // ЗАКРЫТИЕ КОРЗИНЫ
    const closeCart = document.getElementById('closeCart');
    const modal = document.getElementById('cartModal');
    if(closeCart) closeCart.onclick = () => { modal.style.display = 'none'; };
    const closeOrder = document.getElementById('closeOrder');
    const orderModal = document.getElementById('orderModal');
    if(closeOrder) closeOrder.onclick = () => { orderModal.style.display = 'none'; };
    window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; if(e.target == orderModal) orderModal.style.display = 'none'; };

    // ЗАКАЗ
    const cartOrderBtn = document.getElementById('cartOrderBtn');
    if(cartOrderBtn) {
        cartOrderBtn.onclick = () => {
            if (cart.length === 0) { window.showNotification('Корзина пуста'); return; }
            modal.style.display = 'none';
            orderModal.style.display = 'flex';
        };
    }

    // ФОРМЫ
    const orderForm = document.getElementById('orderForm');
    if(orderForm) {
        const phoneInput = document.getElementById('orderPhone'); const nameInput = document.getElementById('orderName'); const emailInput = document.getElementById('orderEmail');
        if (phoneInput && window.IMask) IMask(phoneInput, { mask: '+{7} (000) 000-00-00' });
        orderForm.onsubmit = (e) => {
            e.preventDefault(); if (!validateInput(nameInput, 'name') || !validateInput(phoneInput, 'phone') || !validateInput(emailInput, 'email')) return;
            let msg = `<b>Заказ!</b>\nИмя: ${nameInput.value}\nТел: ${phoneInput.value}\nEmail: ${emailInput.value}\n`;
            cart.forEach(i => msg += `- ${i.sku} ${i.name} (x${i.quantity})\n`);
            sendOrderToTelegram(msg, orderForm);
        };
    }
    const contactForm = document.getElementById('contactPageForm');
    if(contactForm) {
        const nameInput = document.getElementById('contactName'); const phoneInput = document.getElementById('contactPhone');
        if (window.IMask) IMask(phoneInput, { mask: '+{7} (000) 000-00-00' });
        contactForm.onsubmit = (e) => {
            e.preventDefault(); if (!validateInput(nameInput, 'name') || !validateInput(phoneInput, 'phone')) return;
            const msg = `<b>Сообщение!</b>\nИмя: ${nameInput.value}\nТел: ${phoneInput.value}\n${document.getElementById('contactMessage').value}`;
            sendContactToTelegram(msg, document.getElementById('contactFile').files[0], contactForm);
        };
    }

    // КАТАЛОГ
    const catalogGrid = document.getElementById('catalog');
    if(catalogGrid) {
        let allProducts = [], displayedCount = 0, currentCategory = 'all';
        const loadMoreBtn = document.getElementById('loadMoreBtn'); const loadMoreContainer = document.getElementById('loadMoreContainer');
        const searchInput = document.getElementById('searchInput'); const categoryFilter = document.getElementById('categoryFilter'); const sortSelect = document.getElementById('sortSelect'); 

        initCatalog();
        async function initCatalog() {
            try {
                allProducts = await getCatalogData();
                if (allProducts.length === 0) { catalogGrid.innerHTML = '<div class="loader-container"><p class="error-text">Ошибка загрузки данных</p></div>'; return; }
                initCategories(allProducts); renderBatch(true);
                if (sortSelect) sortSelect.addEventListener('change', () => {
                    const t = sortSelect.value;
                    if (t === 'default') allProducts.sort((a, b) => a.id - b.id);
                    else if (t === 'price_asc') allProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
                    else if (t === 'price_desc') allProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
                    else if (t === 'name_asc') allProducts.sort((a, b) => a.name.localeCompare(b.name));
                    renderBatch(true);
                });
            } catch (err) { catalogGrid.innerHTML = '<div class="loader-container"><p class="error-text">Ошибка сети</p></div>'; }
        }
        function initCategories(products) {
            if(!categoryFilter) return;
            const cats = ['Все', ...new Set(products.map(p => p.category).filter(c => c))];
            categoryFilter.innerHTML = '';
            cats.forEach(cat => {
                const btn = document.createElement('button'); btn.className = cat === 'Все' ? 'cat-btn active' : 'cat-btn'; btn.textContent = cat;
                btn.onclick = () => { document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentCategory = cat === 'Все' ? 'all' : cat; renderBatch(true); };
                categoryFilter.appendChild(btn);
            });
        }
        function renderBatch(reset = false) {
            if (reset) { catalogGrid.innerHTML = ''; displayedCount = 0; loadMoreContainer.style.display = 'none'; }
            const sVal = searchInput ? searchInput.value.toLowerCase() : '';
            const filtered = allProducts.filter(p => (currentCategory === 'all' || p.category === currentCategory) && (!sVal || p.name.toLowerCase().includes(sVal) || p.sku.toLowerCase().includes(sVal)));
            if (filtered.length === 0) { catalogGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#ccc;">Товары не найдены</div>'; return; }
            const batch = filtered.slice(displayedCount, displayedCount + SITE_CONFIG.itemsPerPage);
            batch.forEach(p => catalogGrid.appendChild(createCard(p)));
            displayedCount += batch.length;
            if(loadMoreContainer) loadMoreContainer.style.display = (displayedCount < filtered.length) ? 'block' : 'none';
            window.updateCartUI(); 
        }
        if(loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch());
        if(searchInput) searchInput.addEventListener('input', debounce(() => renderBatch(true), 300));

        function createCard(p) {
            const imgUrl = getImageUrl(p.image); const priceFmt = formatPrice(p.price); const nameClean = p.name.replace(/'/g, "");
            const card = document.createElement('div'); card.className = 'product-card'; card.setAttribute('data-product-id', p.id);
            card.innerHTML = `
                <div class="img-wrapper" onclick="openLightbox('${imgUrl}')"><img src="${imgUrl}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='${SITE_CONFIG.placeholderImage}'"></div>
                <div class="product-sku">АРТ: ${p.sku}</div>
                <a href="product.html?id=${p.id}" class="product-title">${p.name}</a>
                <div class="product-price">${priceFmt}</div>
                <div class="btn-group">
                    <a href="product.html?id=${p.id}" class="btn-card btn-blue">Подробнее</a>
                    <button id="btn-add-${p.id}" onclick="addToCart('${p.id}', '${p.sku}', '${nameClean}', '${priceFmt}')" class="btn-card btn-green">В КОРЗИНУ</button>
                    <div id="btn-qty-${p.id}" class="btn-qty-grid hidden"><button onclick="updateItemQty('${p.id}', -1)">-</button><span id="qty-val-${p.id}">1</span><button onclick="updateItemQty('${p.id}', 1)">+</button></div>
                </div>
            `;
            return card;
        }
    }
});

// ФУНКЦИИ ОТПРАВКИ (БЕЗ ИЗМЕНЕНИЙ)
function sendOrderToTelegram(text, form) {
    const url = `https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendMessage`;
    const btn = form.querySelector('button'); const orig = btn.textContent; btn.textContent = '...'; btn.disabled = true;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: SITE_CONFIG.tgChatId, text: text, parse_mode: 'HTML' }) })
    .then(res => { if(res.ok) { cart = []; localStorage.setItem('rassvet_cart', JSON.stringify(cart)); window.updateCartUI(); form.reset(); document.getElementById('orderModal').style.display = 'none'; window.showNotification("Заказ отправлен!"); } else alert("Ошибка"); })
    .catch(() => alert("Ошибка сети")).finally(() => { btn.textContent = orig; btn.disabled = false; });
}
function sendContactToTelegram(text, file, form) {
    const btn = form.querySelector('button'); const orig = btn.textContent; btn.textContent = '...'; btn.disabled = true;
    if (file) {
        const d = new FormData(); d.append('chat_id', SITE_CONFIG.tgChatId); d.append('caption', text); d.append('parse_mode', 'HTML'); d.append('document', file);
        fetch(`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendDocument`, { method: 'POST', body: d }).then(h).catch(e).finally(() => { btn.textContent = orig; btn.disabled = false; });
    } else {
        fetch(`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: SITE_CONFIG.tgChatId, text: text, parse_mode: 'HTML' }) }).then(h).catch(e).finally(() => { btn.textContent = orig; btn.disabled = false; });
    }
    function h(res) { if(res.ok) { window.showNotification("Сообщение отправлено!"); form.reset(); } else window.showNotification("Ошибка"); }
    function e() { window.showNotification("Ошибка сети"); }
}