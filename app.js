/* app.js — Основная логика сайта */

// Глобальные переменные
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'Все';

// DOM Элементы
const catalogGrid = document.getElementById('catalog');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const categoryContainer = document.getElementById('categoryFilter');
const cartCountElement = document.querySelector('.cart-widget'); // Если есть счетчик в шапке
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');

// --- 1. ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCounter();
    
    // Слушатели событий
    searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
    sortSelect.addEventListener('change', () => filterProducts(searchInput.value));
    
    // Инициализация модального окна корзины (если кнопки есть в HTML)
    document.querySelector('.cart-widget')?.addEventListener('click', openCart);
    document.querySelector('.close-cart')?.addEventListener('click', closeCart);
});

// --- 2. ЗАГРУЗКА ДАННЫХ ---
async function fetchProducts() {
    try {
        // Берем URL из config.js
        const response = await fetch(CONFIG.GOOGLE_SHEET_URL);
        const data = await response.text();
        allProducts = parseCSV(data);
        
        // Инициализируем категории и показываем товары
        renderCategories();
        renderProducts(allProducts);
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        catalogGrid.innerHTML = '<div class="error-text">Ошибка загрузки каталога. Попробуйте позже.</div>';
    }
}

// Парсер CSV (превращает таблицу в объекты)
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
    const headers = rows[0].split('\t'); // Предполагаем разделитель Tab (TSV) или ',' для CSV
    
    // Если разделитель запятая, замените '\t' на ',' ниже, но для Google Sheets CSV лучше использовать библиотеку или надежный парсер
    // Простой парсер для CSV (с запятыми):
    return rows.slice(1).map(row => {
        // Учитываем кавычки, если нужно, но для простоты берем split(',')
        // Лучше использовать Google Sheets output=csv
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(','); 
        
        // ВАЖНО: Подстрой индексы под свои колонки в таблице!
        // Допустим: 0-ID, 1-Название, 2-Категория, 3-Цена, 4-Фото, 5-Описание
        // Если используешь простой split, убедись, что в ячейках нет запятых.
        
        const safeSplit = row.split(','); // Упрощенно
        
        return {
            id: safeSplit[0],
            name: safeSplit[1],
            category: safeSplit[2],
            price: parseFloat(safeSplit[3]),
            image: safeSplit[4],
            description: safeSplit[5] || ''
        };
    }).filter(p => p.id && p.name); // Убираем пустые
}

// --- 3. РЕНДЕРИНГ ТОВАРОВ ---
function renderProducts(products) {
    catalogGrid.innerHTML = '';

    // 3.1. Заглушка "Ничего не найдено"
    if (products.length === 0) {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #888;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 20px; opacity: 0.5;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3 style="font-size: 20px; margin-bottom: 10px; color: #fff;">Упс, ничего не найдено</h3>
                <p>Попробуйте изменить запрос или поискать в другой категории.</p>
            </div>
        `;
        loadMoreContainer.style.display = 'none';
        return;
    }

    // 3.2. Генерация карточек
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Форматирование цены
        const priceFormatted = new Intl.NumberFormat('ru-RU').format(product.price);

        card.innerHTML = `
            <div class="product-badge badge-green">В НАЛИЧИИ</div>

            <div class="img-wrapper" onclick="openLightbox('${product.image}')">
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
            </div>
            
            <div class="product-sku">Артикул: ${product.id}</div>
            <a href="#" class="product-title" onclick="openProductModal('${product.id}'); return false;">${product.name}</a>
            <div class="product-price">${priceFormatted} ₽</div>
            
            <div class="btn-group">
                <button class="btn-card btn-blue" onclick="openProductModal('${product.id}')">Подробнее</button>
                <button class="btn-card btn-green" onclick="addToCart('${product.id}')">В корзину</button>
            </div>
        `;
        catalogGrid.appendChild(card);
    });
}

// --- 4. ФИЛЬТРАЦИЯ И ПОИСК ---
function filterProducts(searchTerm = '') {
    const term = searchTerm.toLowerCase();
    
    let filtered = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(term) || 
                              product.id.toLowerCase().includes(term);
        const matchesCategory = currentCategory === 'Все' || product.category === currentCategory;
        
        return matchesSearch && matchesCategory;
    });

    // Сортировка
    const sortValue = sortSelect.value;
    if (sortValue === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortValue === 'name_asc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderProducts(filtered);
}

// --- 5. КАТЕГОРИИ ---
function renderCategories() {
    const categories = ['Все', ...new Set(allProducts.map(p => p.category))];
    categoryContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${cat === 'Все' ? 'active' : ''}`;
        btn.textContent = cat;
        btn.onclick = () => {
            // Переключение активного класса
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = cat;
            filterProducts(searchInput.value);
        };
        categoryContainer.appendChild(btn);
    });
}

// --- 6. КОРЗИНА ---
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    showToast(`Товар добавлен: ${product.name}`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartItems(); // Перерисовка если открыта
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

// --- 7. МОДАЛЬНЫЕ ОКНА ---
// Корзина
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
async function checkout(event) {
    if(event) event.preventDefault();
    
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }

    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    
    // Формируем сообщение
    let msg = `🔥 <b>НОВЫЙ ЗАКАЗ</b>\n\n`;
    msg += `👤 <b>Клиент:</b> ${name}\n`;
    msg += `📞 <b>Телефон:</b> ${phone}\n\n`;
    msg += `📦 <b>Товары:</b>\n`;
    
    let total = 0;
    cart.forEach((item, i) => {
        const sum = item.price * item.qty;
        total += sum;
        msg += `${i+1}. ${item.name} (x${item.qty}) - ${sum}₽\n`;
    });
    
    msg += `\n💰 <b>ИТОГО:</b> ${total} ₽`;

    // Отправка в Telegram
    try {
        const url = `https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: CONFIG.TG_CHAT_ID,
                text: msg,
                parse_mode: 'HTML'
            })
        });
        
        alert('Заказ успешно оформлен! Мы свяжемся с вами.');
        cart = [];
        saveCart();
        closeCart();
    } catch (e) {
        alert('Ошибка отправки. Позвоните нам.');
        console.error(e);
    }
}

// Лайтбокс (Просмотр фото)
function openLightbox(imgSrc) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox active';
    lightbox.innerHTML = `
        <span class="lightbox-close" onclick="this.parentElement.remove()">&times;</span>
        <img src="${imgSrc}" class="lightbox-content">
    `;
    // Закрытие по клику на фон
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.remove();
    });
    document.body.appendChild(lightbox);
}

// Уведомления (Toast)
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

/* --- ЗАЩИТА КОДА (ВАРИАНТ 2) --- */
// Запрет контекстного меню (ПКМ)
document.addEventListener('contextmenu', event => event.preventDefault());

// Запрет горячих клавиш (F12, Ctrl+Shift+I и т.д.)
document.onkeydown = function(e) {
    if (e.keyCode == 123) { // F12
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { // Ctrl+Shift+I
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { // Ctrl+Shift+C
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { // Ctrl+Shift+J
        return false;
    }
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { // Ctrl+U
        return false;
    }
}

// Обработчик формы заказа
const orderForm = document.querySelector('.order-form');
if (orderForm) {
    orderForm.addEventListener('submit', checkout);
}