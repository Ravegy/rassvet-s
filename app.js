/* app.js — Исправленная версия с Шапкой и Подвалом */

// Глобальные переменные
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'Все';

// DOM Элементы
const catalogGrid = document.getElementById('catalog');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const categoryContainer = document.getElementById('categoryFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');

// --- 1. ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', () => {
    // Сначала рисуем шапку и подвал, чтобы они появились
    renderHeader();
    renderFooter();
    
    // Потом грузим товары
    fetchProducts();
    updateCartCounter();
    
    // Слушатели событий
    if(searchInput) searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
    if(sortSelect) sortSelect.addEventListener('change', () => filterProducts(searchInput.value));
    
    // Инициализация модального окна корзины (вешаем события после рендера шапки)
    setTimeout(() => {
        const cartWidget = document.querySelector('.cart-widget');
        if(cartWidget) cartWidget.addEventListener('click', openCart);
        
        const closeBtn = document.querySelector('.close-cart');
        if(closeBtn) closeBtn.addEventListener('click', closeCart);
        
        // Мобильное меню
        const menuBtn = document.querySelector('.menu-btn');
        const nav = document.querySelector('.header-nav');
        if(menuBtn && nav) {
            menuBtn.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
    }, 500); // Небольшая задержка, чтобы элементы успели нарисоваться
});

// --- 2. РЕНДЕР ШАПКИ (ВЕРНУЛ ЭТУ ФУНКЦИЮ) ---
function renderHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    header.innerHTML = `
        <div class="container">
            <div class="header-main">
                <a href="index.html" class="logo-text">
                    <h1>РАССВЕТ-С</h1>
                </a>

                <nav class="header-nav">
                    <a href="index.html" class="nav-link active">Каталог</a>
                    <a href="#" class="nav-link">О компании</a>
                    <a href="#" class="nav-link">Доставка и оплата</a>
                    <a href="#" class="nav-link">Контакты</a>
                </nav>

                <div class="header-contacts">
                    <div class="cart-widget">КОРЗИНА: 0</div>
                    <button class="menu-btn">
                        <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="cart-modal">
            <div class="cart-content">
                <div class="cart-header">
                    <h2>Ваш заказ</h2>
                    <span class="close-cart">&times;</span>
                </div>
                <div class="cart-items"></div>
                <div class="cart-footer">
                    <div class="cart-total">Итого: 0 ₽</div>
                    <form class="order-form">
                        <div class="form-group">
                            <input type="text" id="orderName" class="form-input" placeholder="Ваше имя" required>
                        </div>
                        <div class="form-group">
                            <input type="tel" id="orderPhone" class="form-input" placeholder="Телефон" required>
                        </div>
                        <button type="submit" class="btn-cart-order">Оформить заказ в WhatsApp</button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// --- 3. РЕНДЕР ПОДВАЛА (ВЕРНУЛ ЭТУ ФУНКЦИЮ) ---
function renderFooter() {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="container">
            <div class="footer-content">
                <div class="footer-col">
                    <h4>О компании</h4>
                    <p>ООО «РАССВЕТ-С» — надежный поставщик запчастей для лесозаготовительной техники Komatsu, Ponsse, John Deere.</p>
                    <p>Работаем по всей России. Склад в Санкт-Петербурге.</p>
                </div>
                <div class="footer-col">
                    <h4>Навигация</h4>
                    <nav class="footer-nav">
                        <a href="index.html">Каталог запчастей</a>
                        <a href="#">Условия оплаты</a>
                        <a href="#">Доставка</a>
                        <a href="#">Контакты</a>
                    </nav>
                </div>
                <div class="footer-col">
                    <h4>Контакты</h4>
                    <div class="footer-contacts-list">
                        <div class="footer-contact-item">
                            <div class="footer-icon">
                                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            </div>
                            <div class="footer-contact-info">
                                <span class="footer-contact-label">Телефон</span>
                                <a href="tel:+79991234567" class="footer-phone-big">+7 (999) 123-45-67</a>
                            </div>
                        </div>
                        <div class="footer-socials">
                            <a href="#" class="social-btn whatsapp"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>
                            <a href="#" class="social-btn telegram"><svg viewBox="0 0 24 24"><path d="M21.1 5L2.6 12l5.8 2.1 2.3 7 1.8-4.5 7.6-6.8-6 7.4 5.3 4L21.8 5z"/></svg></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p class="footer-disclaimer">© 2013-2026 ООО «РАССВЕТ-С». Все права защищены. Не является публичной офертой.</p>
            </div>
        </div>
    `;
}

// --- 4. ЗАГРУЗКА ДАННЫХ (КАТАЛОГ) ---
async function fetchProducts() {
    try {
        // ПРОВЕРКА: Есть ли конфиг?
        if (typeof CONFIG === 'undefined' || !CONFIG.GOOGLE_SHEET_URL) {
            throw new Error('CONFIG не найден или нет ссылки на таблицу');
        }

        const response = await fetch(CONFIG.GOOGLE_SHEET_URL);
        if (!response.ok) throw new Error('Ошибка сети');
        
        const data = await response.text();
        allProducts = parseCSV(data);
        
        renderCategories();
        renderProducts(allProducts);
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        // Если каталог есть в HTML, пишем ошибку туда
        if (catalogGrid) {
            catalogGrid.innerHTML = `
                <div class="error-text" style="grid-column: 1/-1; text-align: center; color: #ff4444;">
                    ОШИБКА ЗАГРУЗКИ КАТАЛОГА.<br>
                    <span style="font-size: 14px; color: #888;">Проверьте файл config.js и ссылку на таблицу.</span>
                </div>
            `;
        }
    }
}

// Парсер CSV
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
    // Пропускаем заголовок (slice 1)
    return rows.slice(1).map(row => {
        // Простой сплит по запятой (если в названиях нет запятых)
        // Если названия содержат запятые, нужен более сложный Regex, но для начала так:
        const values = row.split(','); 
        
        // ВАЖНО: Проверь порядок столбцов в твоей таблице!
        // Здесь ожидается: ID, NAME, CATEGORY, PRICE, IMAGE
        return {
            id: values[0] || 'ID',
            name: values[1] || 'Без названия',
            category: values[2] || 'Разное',
            price: parseFloat(values[3]) || 0,
            image: values[4] || 'https://placehold.co/400?text=NO+IMAGE',
            description: values[5] || ''
        };
    }).filter(p => p.id && p.name);
}

// --- 5. РЕНДЕРИНГ ТОВАРОВ (СО СТИКЕРАМИ) ---
function renderProducts(products) {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    if (products.length === 0) {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #888;">
                <h3>Упс, ничего не найдено</h3>
            </div>
        `;
        if(loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const priceFormatted = new Intl.NumberFormat('ru-RU').format(product.price);

        card.innerHTML = `
            <div class="product-badge badge-green">В НАЛИЧИИ</div>
            <div class="img-wrapper" onclick="openLightbox('${product.image}')">
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            </div>
            <div class="product-sku">Артикул: ${product.id}</div>
            <a href="#" class="product-title" onclick="return false;">${product.name}</a>
            <div class="product-price">${priceFormatted} ₽</div>
            <div class="btn-group">
                <button class="btn-card btn-blue">Подробнее</button>
                <button class="btn-card btn-green" onclick="addToCart('${product.id}')">В корзину</button>
            </div>
        `;
        catalogGrid.appendChild(card);
    });
}

// --- 6. ФИЛЬТРАЦИЯ ---
function filterProducts(searchTerm = '') {
    const term = searchTerm.toLowerCase();
    let filtered = allProducts.filter(product => {
        return (product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term)) &&
               (currentCategory === 'Все' || product.category === currentCategory);
    });

    if(sortSelect) {
        const sortValue = sortSelect.value;
        if (sortValue === 'price_asc') filtered.sort((a, b) => a.price - b.price);
        else if (sortValue === 'price_desc') filtered.sort((a, b) => b.price - a.price);
        else if (sortValue === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderProducts(filtered);
}

// --- 7. КАТЕГОРИИ ---
function renderCategories() {
    if (!categoryContainer) return;
    const categories = ['Все', ...new Set(allProducts.map(p => p.category))];
    categoryContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${cat === 'Все' ? 'active' : ''}`;
        btn.textContent = cat;
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            if(searchInput) filterProducts(searchInput.value);
            else filterProducts();
        };
        categoryContainer.appendChild(btn);
    });
}

// --- 8. КОРЗИНА ---
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) existingItem.qty++;
    else cart.push({ ...product, qty: 1 });
    saveCart();
    showToast(`Добавлено: ${product.name}`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartItems();
}

function changeQty(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) removeFromCart(productId);
        else saveCart();
    }
    renderCartItems();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
}

function updateCartCounter() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const widget = document.querySelector('.cart-widget');
    if (widget) widget.textContent = `КОРЗИНА: ${totalQty}`;
}

function openCart() {
    const modal = document.querySelector('.cart-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderCartItems();
    }
}

function closeCart() {
    const modal = document.querySelector('.cart-modal');
    if (modal) modal.style.display = 'none';
}

function renderCartItems() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.querySelector('.cart-total');
    if (!container) return;

    container.innerHTML = '';
    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-title">${item.name}</span>
                <span class="cart-item-price">${item.price} ₽</span>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                <span class="qty-count">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
            </div>
            <button class="btn-remove" onclick="removeFromCart('${item.id}')">&times;</button>
        `;
        container.appendChild(div);
    });

    if (totalEl) totalEl.textContent = `Итого: ${new Intl.NumberFormat('ru-RU').format(totalPrice)} ₽`;
}

// Отправка заказа
const orderForm = document.querySelector('.order-form'); 
// Обработчик вешается через делегирование или при рендере, но так как форма динамическая,
// лучше повесить слушатель на документ или при открытии корзины.
// В init я добавил слушатель на документ, но тут продублирую логику
document.addEventListener('submit', async (e) => {
    if (e.target.classList.contains('order-form')) {
        e.preventDefault();
        if (cart.length === 0) return alert('Корзина пуста');
        
        const name = document.getElementById('orderName').value;
        const phone = document.getElementById('orderPhone').value;
        
        let msg = `🔥 <b>НОВЫЙ ЗАКАЗ</b>\n👤 ${name}\n📞 ${phone}\n\n`;
        let total = 0;
        cart.forEach((item, i) => {
            const sum = item.price * item.qty;
            total += sum;
            msg += `${i+1}. ${item.name} x${item.qty} = ${sum}₽\n`;
        });
        msg += `\n💰 <b>ИТОГО: ${total} ₽</b>`;

        try {
            if (typeof CONFIG === 'undefined') throw new Error('Нет конфига');
            await fetch(`https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ chat_id: CONFIG.TG_CHAT_ID, text: msg, parse_mode: 'HTML' })
            });
            alert('Заказ отправлен!');
            cart = [];
            saveCart();
            closeCart();
        } catch (err) {
            alert('Ошибка отправки. Свяжитесь по телефону.');
            console.error(err);
        }
    }
});


// Лайтбокс
function openLightbox(imgSrc) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox active';
    lightbox.innerHTML = `<span class="lightbox-close">&times;</span><img src="${imgSrc}" class="lightbox-content">`;
    lightbox.onclick = (e) => {
        if(e.target === lightbox || e.target.classList.contains('lightbox-close')) lightbox.remove();
    };
    document.body.appendChild(lightbox);
}

// Toast
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ЗАЩИТА */
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if (e.keyCode == 123) return false;
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
}