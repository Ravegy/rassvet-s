// --- НАСТРОЙКИ TELEGRAM ---
const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o'; 
const chatId = '1017718880';

// Загрузка корзины из памяти браузера, чтобы она не пропадала при переходе
let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || [];
let currentCategory = 'all';
let visibleCount = 12;

// Сделаем функции глобальными, чтобы onclick в твоем HTML их видел
window.showToast = (message, isError = false) => {
    const toast = document.getElementById('custom-toast');
    const toastText = document.getElementById('toast-text');
    if (!toast) return;
    toastText.innerText = message;
    toast.style.borderColor = isError ? 'var(--error)' : 'var(--accent)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
};

window.addToCart = (name) => {
    const product = productsData.find(p => p.name === name);
    const inCart = cart.find(item => item.name === name);
    if (inCart) {
        inCart.count++;
    } else {
        cart.push({ ...product, count: 1 });
    }
    saveAndRender();
    window.showToast('Добавлено в корзину');
};

window.changeCount = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.count += delta;
        if (item.count < 1) cart = cart.filter(i => i.name !== name);
    }
    saveAndRender();
};

window.zoomImage = (src) => {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('zoomed-img');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
    }
};

function saveAndRender() {
    localStorage.setItem('rassvet_cart', JSON.stringify(cart));
    renderUI();
}

function renderUI() {
    // 1. Обновление счетчиков корзины (есть на всех страницах)
    const badge = document.getElementById('cart-count');
    const totalPrice = document.getElementById('cart-total-price');
    if (badge) badge.innerText = cart.reduce((s, i) => s + i.count, 0);
    if (totalPrice) totalPrice.innerText = cart.reduce((s, i) => s + (i.price * i.count), 0).toLocaleString() + ' ₽';

    // 2. Рендер товаров (только если есть сетка на странице)
    const grid = document.getElementById('products-grid');
    if (grid) {
        const search = document.getElementById('search-input')?.value.toLowerCase() || "";
        const filtered = productsData.filter(p => 
            (currentCategory === 'all' || p.category === currentCategory) &&
            (p.name.toLowerCase().includes(search) || p.article.toLowerCase().includes(search))
        );
        
        grid.innerHTML = filtered.slice(0, visibleCount).map(p => `
            <div class="product-card">
                <img src="images/${p.image}" alt="${p.name}" onclick="window.zoomImage(this.src)">
                <div class="product-info">
                    <div class="category-label">${p.category}</div>
                    <h3>${p.name}</h3>
                    <p class="article">Арт: ${p.article}</p>
                    <div class="card-bottom">
                        <span class="price">${p.price.toLocaleString()} ₽</span>
                        <button class="add-btn" onclick="window.addToCart('${p.name}')">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 3. Рендер списка в корзине
    const cartList = document.getElementById('cart-items-list');
    if (cartList) {
        cartList.innerHTML = cart.length ? cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-bottom">
                        <div class="count-ctrl">
                            <button onclick="window.changeCount('${item.name}', -1)">-</button>
                            <span>${item.count}</span>
                            <button onclick="window.changeCount('${item.name}', 1)">+</button>
                        </div>
                        <span class="price">${(item.price * item.count).toLocaleString()} ₽</span>
                    </div>
                </div>
            </div>
        `).join('') : '<p style="text-align:center; padding:20px; opacity:0.5;">Корзина пуста</p>';
    }
}

// Инициализация событий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    renderUI();

    // Категории
    document.getElementById('category-tags')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat;
            renderUI();
        }
    });

    // Поиск
    document.getElementById('search-input')?.addEventListener('input', renderUI);

    // Управление шторкой корзины
    const trigger = document.getElementById('cart-trigger');
    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('cart-overlay');
    const closeBtn = document.getElementById('cart-close');

    const toggleCart = (show) => {
        if (sideCart) sideCart.classList.toggle('open', show);
        if (overlay) overlay.style.display = show ? 'block' : 'none';
    };

    trigger?.addEventListener('click', () => toggleCart(true));
    closeBtn?.addEventListener('click', () => toggleCart(false));
    overlay?.addEventListener('click', () => toggleCart(false));

    // Отправка заказа из корзины
    document.getElementById('cart-send-btn')?.addEventListener('click', async () => {
        const name = document.getElementById('cart-name').value;
        const phone = document.getElementById('cart-phone').value;

        if (!name || phone.length < 10 || cart.length === 0) {
            window.showToast('Заполните данные и добавьте товары', true);
            return;
        }

        const itemsText = cart.map(i => `${i.name} (x${i.count})`).join('%0A');
        const message = `📦 <b>Новый заказ!</b>%0A👤 Имя: ${name}%0A📞 Тел: ${phone}%0A🛒 Товары:%0A${itemsText}`;

        try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}&parse_mode=HTML`);
            if (res.ok) {
                window.showToast('Заказ успешно отправлен!');
                cart = [];
                saveAndRender();
                toggleCart(false);
            }
        } catch (e) {
            window.showToast('Ошибка при отправке', true);
        }
    });
});