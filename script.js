// ПЕРВУЮ СТРОЧКУ С IMPORT УДАЛИЛИ!

// --- НАСТРОЙКИ TELEGRAM ---
const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o'; 
const chatId = '1017718880';

let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || []; 
let currentCategory = 'all';
let visibleCount = 12;

function saveCart() {
    localStorage.setItem('rassvet_cart', JSON.stringify(cart));
}

// Глобальные функции для кнопок
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
    // productsData теперь берется из глобальной видимости (из соседнего файла)
    const product = productsData.find(p => p.name === name);
    const inCart = cart.find(item => item.name === name);
    if (inCart) inCart.count++;
    else cart.push({ ...product, count: 1 });
    saveCart();
    render();
    window.showToast('Товар добавлен в корзину');
};

window.changeCount = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.count += delta;
        if (item.count < 1) cart = cart.filter(i => i.name !== name);
    }
    saveCart();
    render();
};

window.zoomImage = (src) => {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('zoomed-img');
    if (modal) { img.src = src; modal.style.display = 'flex'; }
};

function render() {
    const grid = document.getElementById('products-grid');
    const cartCountBadge = document.getElementById('cart-count');
    
    if (cartCountBadge) {
        cartCountBadge.innerText = cart.reduce((sum, item) => sum + item.count, 0);
    }

    if (grid) {
        const searchInput = document.getElementById('search-input');
        const searchValue = searchInput ? searchInput.value.toLowerCase() : "";

        // Фильтрация
        const filtered = productsData.filter(p => 
            (currentCategory === 'all' || p.category === currentCategory) &&
            (p.name.toLowerCase().includes(searchValue) || p.article.toLowerCase().includes(searchValue))
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
    
    // Обновление списка в корзине
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

    const totalDisplay = document.getElementById('cart-total-price');
    if (totalDisplay) {
        const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
        totalDisplay.innerText = `${total.toLocaleString()} ₽`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render();
    
    // Поиск
    document.getElementById('search-input')?.addEventListener('input', () => {
        visibleCount = 12;
        render();
    });

    // Категории
    document.getElementById('category-tags')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat;
            visibleCount = 12;
            render();
        }
    });

    // Корзина
    const cartTrigger = document.getElementById('cart-trigger');
    const sideCart = document.getElementById('side-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    
    cartTrigger?.addEventListener('click', () => {
        sideCart.classList.add('open');
        cartOverlay.style.display = 'block';
    });

    [document.getElementById('cart-close'), cartOverlay].forEach(el => {
        el?.addEventListener('click', () => {
            sideCart.classList.remove('open');
            cartOverlay.style.display = 'none';
        });
    });
});