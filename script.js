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

    root.innerHTML = filtered.slice(0, visibleCount).map((p) => {
        const itemInCart = cart.find(item => item.article === p.article);

        const cartAction = itemInCart 
            ? `<div class="qty-controls">
                <button class="qty-btn" onclick="window.updateQty('${p.article}', -1)">-</button>
                <div class="qty-val">${itemInCart.qty}</div>
                <button class="qty-btn" onclick="window.updateQty('${p.article}', 1)">+</button>
               </div>`
            : `<button class="btn-add" onclick="window.addToCart('${p.article}')"></button>`;

        return `
            <div class="card">
                <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src, '${p.name}')" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
                <h3>${p.name}</h3>
                <span class="art-text">Арт: ${p.article}</span>
                <div class="card-price">${p.price.toLocaleString()} ₽</div>
                <div class="btn-row">
                    <button class="btn-info" onclick="alert('Запрос отправлен')">Запросить</button>
                    ${cartAction}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('show-more-box').style.display = filtered.length > visibleCount ? 'block' : 'none';
    updateCartDisplay();
}

// КОРЗИНА (Исправлено: теперь добавляет только один товар)
window.addToCart = (article) => {
    const product = productsData.find(p => p.article === article);
    if (product) {
        const existing = cart.find(i => i.article === article);
        if (!existing) {
            cart.push({ ...product, qty: 1 });
        }
        render(); // Обновляем только текущее состояние интерфейса
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

function updateCartDisplay() {
    const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    document.getElementById('cart-count').innerText = totalCount;
    document.getElementById('cart-total-price').innerText = `Итого: ${totalPrice.toLocaleString()} ₽`;

    const list = document.getElementById('cart-items-list');
    if (list) {
        list.innerHTML = cart.length === 0 
            ? '<p style="text-align:center; color:#444; margin-top:50px;">Корзина пуста</p>'
            : cart.map(item => `
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:10px; background:#1a1a1a; border-radius:10px;">
                    <img src="images/parts/${item.image}" style="width:40px; height:40px; object-fit:contain;">
                    <div style="flex:1; font-size:0.8rem;">${item.name}</div>
                    <div style="color:var(--accent); font-weight:bold;">${item.qty} шт.</div>
                </div>
            `).join('');
    }
}

// УПРАВЛЕНИЕ ПАНЕЛЬЮ
const sideCart = document.getElementById('side-cart');
const overlay = document.getElementById('cart-overlay');

document.getElementById('cart-trigger').onclick = () => {
    sideCart.classList.add('open');
    overlay.style.display = 'block';
};

const closeCart = () => {
    sideCart.classList.remove('open');
    overlay.style.display = 'none';
};
document.getElementById('cart-close').onclick = closeCart;
overlay.onclick = closeCart;

// ЗУМ
window.zoomImage = (src, name) => {
    const modal = document.getElementById('image-modal');
    document.getElementById('zoomed-img').src = src;
    document.getElementById('zoom-caption').innerText = name;
    modal.style.display = 'flex';
};

// СОБЫТИЯ
document.getElementById('search-input')?.addEventListener('input', () => { visibleCount = 12; render(); });
document.getElementById('category-tags')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12;
        render();
    }
});

render();