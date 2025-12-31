import productsData from './products.js';

let cart = []; 
let currentCategory = 'all';
let visibleCount = 12;

function render() {
    const root = document.getElementById('catalog');
    if (!root) return;

    const searchValue = document.getElementById('search-input')?.value.toLowerCase().trim() || "";
    
    const filtered = productsData.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchValue) || p.article.toLowerCase().includes(searchValue);
        return matchesCategory && matchesSearch;
    });

    // Отрисовка сетки товаров
    root.innerHTML = filtered.slice(0, visibleCount).map((p) => {
        const itemInCart = cart.find(item => item.article === p.article);

        const cartAction = itemInCart 
            ? `<div class="qty-controls">
                <button class="qty-btn" onclick="window.updateQty('${p.article}', -1)">-</button>
                <div class="qty-val">${itemInCart.qty}</div>
                <button class="qty-btn" onclick="window.updateQty('${p.article}', 1)">+</button>
               </div>`
            : `<button class="btn-add" onclick="window.addToCart('${p.article}')">+</button>`;

        return `
            <div class="card">
                <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src)" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
                <h3>${p.name}</h3>
                <span class="art-text">АРТ: ${p.article}</span>
                <div class="card-price">${p.price.toLocaleString()} ₽</div>
                <div class="btn-row">
                    <button class="btn-info" onclick="window.requestProduct('${p.article}')">Запросить</button>
                    ${cartAction}
                </div>
            </div>
        `;
    }).join('');

    // Кнопка "Показать еще"
    const showMoreBox = document.getElementById('show-more-box');
    if (showMoreBox) {
        showMoreBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
    }
    updateCartDisplay();
}

// Логика корзины
window.addToCart = (article) => {
    const product = productsData.find(p => p.article === article);
    if (product) {
        cart.push({ ...product, qty: 1 });
        render();
    }
};

window.updateQty = (article, delta) => {
    const index = cart.findIndex(i => i.article === article);
    if (index !== -1) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        render();
    }
};

window.requestProduct = (article) => {
    if (!cart.find(i => i.article === article)) window.addToCart(article);
    document.getElementById('side-cart').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
};

function updateCartDisplay() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    document.getElementById('cart-total-price').innerText = `Итого: ${cart.reduce((sum, i) => sum + (i.price * i.qty), 0).toLocaleString()} ₽`;

    const listEl = document.getElementById('cart-items-list');
    if (listEl) {
        listEl.innerHTML = cart.map(item => `
            <div class="cart-item-row">
                <img src="images/parts/${item.image}" onerror="this.src='https://via.placeholder.com/50x50'">
                <div style="flex:1">
                    <div style="font-size:0.9rem; font-weight:bold;">${item.name}</div>
                    <div style="font-size:0.8rem; color:var(--accent);">${item.price.toLocaleString()} ₽</div>
                </div>
                <div class="qty-controls" style="transform:scale(0.8)">
                    <button class="qty-btn" onclick="window.updateQty('${item.article}', -1)">-</button>
                    <div class="qty-val">${item.qty}</div>
                    <button class="qty-btn" onclick="window.updateQty('${item.article}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }
}

// События
document.getElementById('load-more-btn')?.addEventListener('click', () => {
    visibleCount += 12;
    render();
});

document.getElementById('search-input')?.addEventListener('input', () => {
    visibleCount = 12;
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

// Открытие корзины
document.getElementById('cart-trigger').onclick = () => {
    document.getElementById('side-cart').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
};

const closeCart = () => {
    document.getElementById('side-cart').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
};

document.getElementById('cart-close').onclick = closeCart;
document.getElementById('cart-overlay').onclick = closeCart;

window.zoomImage = (src) => {
    const modal = document.getElementById('image-modal');
    document.getElementById('zoomed-img').src = src;
    modal.style.display = 'flex';
};

render();