import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

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
                <div class="card-top">
                    <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src, '${p.name.replace(/'/g, "\\'")}')" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
                    <h3>${p.name}</h3>
                    <span class="art-text">Арт: ${p.article}</span>
                </div>
                <div class="card-bottom">
                    <div class="card-price">${p.price.toLocaleString()} ₽</div>
                    <div class="btn-row">
                        <button class="btn-info" onclick="alert('Запрос по товару ${p.article} отправлен')">Запросить</button>
                        ${cartAction}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('show-more-box').style.display = filtered.length > visibleCount ? 'block' : 'none';
    updateCartDisplay();
}

// КОРЗИНА
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

function updateCartDisplay() {
    const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    document.getElementById('cart-count').innerText = totalCount;
    document.getElementById('cart-total-price').innerText = `Итого: ${totalPrice.toLocaleString()} ₽`;

    const list = document.getElementById('cart-items-list');
    list.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="images/parts/${item.image}">
            <div style="flex:1">
                <h4>${item.name}</h4>
                <p>${item.qty} шт. x ${item.price.toLocaleString()} ₽</p>
            </div>
            <button class="qty-btn" onclick="window.updateQty('${item.article}', -1)" style="color:#ff5252">×</button>
        </div>
    `).join('');
}

// ПАНЕЛЬ КОРЗИНЫ
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