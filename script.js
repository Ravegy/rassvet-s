import productsData from './products.js';

// --- НАСТРОЙКИ TELEGRAM ---
const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o'; 
const chatId = '1017718880';

// Загрузка корзины
let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || []; 
let currentCategory = 'all';
let visibleCount = 12;

// Сохранение корзины
function saveCart() {
    localStorage.setItem('rassvet_cart', JSON.stringify(cart));
}

// === СИСТЕМА УВЕДОМЛЕНИЙ (TOAST) ===
window.showToast = (message, isError = false) => {
    const toast = document.getElementById('custom-toast');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.querySelector('.toast-icon');
    
    if (!toast) return;

    toastText.innerText = message;
    
    if (isError) {
        toast.style.borderColor = 'var(--error)';
        if (toastIcon) {
            toastIcon.style.background = 'var(--error)';
            toastIcon.innerText = '!';
        }
    } else {
        toast.style.borderColor = 'var(--accent)';
        if (toastIcon) {
            toastIcon.style.background = 'var(--accent)';
            toastIcon.innerText = '✓';
        }
    }

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
};

// === УНИВЕРСАЛЬНЫЙ РЕНДЕРИНГ ===
function render() {
    const grid = document.getElementById('products-grid');
    const cartList = document.getElementById('cart-items-list');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    // 1. Обновляем счетчик на иконке (если она есть)
    if (cartCountBadge) {
        cartCountBadge.innerText = cart.reduce((sum, item) => sum + item.count, 0);
    }

    // 2. Обновляем сетку товаров (только на главной)
    if (grid) {
        const searchInput = document.getElementById('search-input');
        const searchValue = searchInput ? searchInput.value.toLowerCase() : "";

        const filtered = productsData
            .filter(p => currentCategory === 'all' || p.category === currentCategory)
            .filter(p => p.name.toLowerCase().includes(searchValue) || p.article.toLowerCase().includes(searchValue));

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

        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = visibleCount >= filtered.length ? 'none' : 'block';
        }
    }

    // 3. Обновляем список товаров в боковой корзине
    if (cartList) {
        if (cart.length === 0) {
            cartList.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.5;">Корзина пуста</p>';
        } else {
            cartList.innerHTML = cart.map(item => `
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
            `).join('');
        }
    }

    // 4. Обновляем итоговую сумму
    if (cartTotalPrice) {
        const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
        cartTotalPrice.innerText = `${total.toLocaleString()} ₽`;
    }
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ (доступны для onclick) ===
window.addToCart = (name) => {
    const product = productsData.find(p => p.name === name);
    const inCart = cart.find(item => item.name === name);
    
    if (inCart) {
        inCart.count++;
    } else {
        cart.push({ ...product, count: 1 });
    }
    
    saveCart();
    render();
    window.showToast('Товар добавлен в корзину');
};

window.changeCount = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.count += delta;
        if (item.count < 1) {
            cart = cart.filter(i => i.name !== name);
        }
    }
    saveCart();
    render();
};

window.zoomImage = (src) => {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('zoomed-img');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
    }
};

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    render();

    // Поиск и фильтры
    document.getElementById('search-input')?.addEventListener('input', () => {
        visibleCount = 12;
        render();
    });

    document.getElementById('load-more-btn')?.addEventListener('click', () => {
        visibleCount += 12;
        render();
    });

    document.getElementById('category-tags')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat;
            visibleCount = 12;
            render();
        }
    });

    // Управление корзиной (открытие/закрытие)
    const cartTrigger = document.getElementById('cart-trigger');
    const sideCart = document.getElementById('side-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartClose = document.getElementById('cart-close');

    const openCart = () => {
        sideCart?.classList.add('open');
        if (cartOverlay) cartOverlay.style.display = 'block';
    };

    const closeCart = () => {
        sideCart?.classList.remove('open');
        if (cartOverlay) cartOverlay.style.display = 'none';
    };

    cartTrigger?.addEventListener('click', openCart);
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);

    // Отправка заказа в Telegram
    const sendBtn = document.getElementById('cart-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const name = document.getElementById('cart-name')?.value;
            const phone = document.getElementById('cart-phone')?.value;
            const email = document.getElementById('cart-email')?.value;

            if (!name || !phone || cart.length === 0) {
                window.showToast('Заполните данные и добавьте товары', true);
                return;
            }

            sendBtn.disabled = true;
            sendBtn.innerText = 'Отправка...';

            const itemsText = cart.map(i => `• ${i.name} (${i.count} шт.) — ${i.price * i.count} ₽`).join('%0A');
            const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
            
            const text = `🛒 <b>НОВЫЙ ЗАКАЗ</b>%0A👤 Имя: ${name}%0A📞 Тел: ${phone}%0A📧 Email: ${email}%0A📦 Товары:%0A${itemsText}%0A%0A💰 <b>ИТОГО: ${total} ₽</b>`;

            try {
                const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${text}&parse_mode=HTML`);
                if (res.ok) {
                    window.showToast('Заказ успешно отправлен!');
                    cart = [];
                    saveCart();
                    render();
                    closeCart();
                    document.getElementById('order-form')?.reset();
                }
            } catch (e) {
                window.showToast('Ошибка при отправке', true);
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerText = 'Оформить заявку';
            }
        });
    }
});