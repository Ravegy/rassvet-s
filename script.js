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

    root.innerHTML = filtered.map((p, index) => {
        const isHidden = index >= visibleCount ? 'hidden' : '';
        const itemInCart = cart.find(item => item.article === p.article);

        const cartAction = itemInCart 
            ? `<div class="qty-controls">
                <button class="qty-btn" onclick="window.updateQty('${p.article}', -1)">-</button>
                <div class="qty-val">${itemInCart.qty}</div>
                <button class="qty-btn" onclick="window.updateQty('${p.article}', 1)">+</button>
               </div>`
            : `<button class="btn-add" onclick="window.addToCart('${p.article}')"></button>`;

        return `
            <div class="card ${isHidden}">
                <div class="card-top">
                    <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src, '${p.name.replace(/'/g, "\\'")}')">
                    <h3>${p.name}</h3>
                    <span class="art-text">Арт: ${p.article}</span>
                </div>
                <div class="card-bottom">
                    <div class="card-price">${p.price.toLocaleString()} ₽</div>
                    <div class="btn-row">
                        <button class="btn-info" onclick="window.openSingleRequest('${p.name.replace(/'/g, "\\'")}', '${p.article}')">Запросить</button>
                        ${cartAction}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('show-more-box').style.display = filtered.length > visibleCount ? 'block' : 'none';
    updateCartDisplay();
}

window.addToCart = (article) => {
    const product = productsData.find(p => p.article === article);
    cart.push({ ...product, qty: 1 });
    render();
};

window.updateQty = (article, delta) => {
    const index = cart.findIndex(i => i.article === article);
    if (index !== -1) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    render();
};

function updateCartDisplay() {
    const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    const badge = document.getElementById('cart-count');
    if(badge) badge.innerText = totalCount;
    
    const totalPriceEl = document.getElementById('cart-total-price');
    if(totalPriceEl) totalPriceEl.innerText = `Итого: ${totalPrice.toLocaleString()} ₽`;

    const list = document.getElementById('cart-items-list');
    if(list) {
        list.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="images/parts/${item.image}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.qty} шт. × ${item.price.toLocaleString()} ₽</p>
                </div>
                <button class="qty-btn" onclick="window.updateQty('${item.article}', -1)" style="color: #ff5252">×</button>
            </div>
        `).join('');
    }
}

async function sendCartRequest() {
    const name = document.getElementById('cart-name').value.trim();
    const phone = document.getElementById('cart-phone').value.trim();
    if (cart.length === 0) return alert('Корзина пуста');
    if (!name || !phone) return alert('Заполните данные');

    const itemsStr = cart.map(i => `• ${i.name} (арт: ${i.article}) — ${i.qty} шт.`).join('\n');
    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const msg = `🛒 НОВЫЙ ЗАКАЗ\n\n👤 Клиент: ${name}\n📞 Тел: ${phone}\n\n📦 Товары:\n${itemsStr}\n\n💰 Итого: ${total.toLocaleString()} ₽`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg })
        });
        if (res.ok) {
            alert('Заявка отправлена!');
            cart = [];
            toggleCart(false);
            render();
        }
    } catch (e) { alert('Ошибка сети'); }
}

const toggleCart = (show) => {
    document.getElementById('side-cart').classList.toggle('open', show);
    document.getElementById('cart-overlay').style.display = show ? 'block' : 'none';
};

document.getElementById('cart-trigger').onclick = () => toggleCart(true);
document.getElementById('cart-close').onclick = () => toggleCart(false);
document.getElementById('cart-overlay').onclick = () => toggleCart(false);
document.getElementById('cart-send-btn').onclick = sendCartRequest;

window.openSingleRequest = (name, art) => {
    document.getElementById('modal-product-name').innerHTML = `${name} <span>Артикул: ${art}</span>`;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('modal').style.display = 'none';

window.zoomImage = (src, name) => {
    document.getElementById('zoomed-img').src = src;
    document.getElementById('zoom-caption').innerText = name;
    document.getElementById('image-modal').style.display = 'flex';
};

const setupPhoneMask = (id) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (!v || v[0] !== '7') v = '7' + v;
        v = v.substring(0, 11);
        let res = '+7';
        if (v.length > 1) res += ' (' + v.substring(1, 4);
        if (v.length >= 5) res += ') ' + v.substring(4, 7);
        if (v.length >= 8) res += '-' + v.substring(7, 9);
        if (v.length >= 10) res += '-' + v.substring(9, 11);
        e.target.value = res;
    });
};
setupPhoneMask('user-phone');
setupPhoneMask('cart-phone');

document.getElementById('search-input')?.addEventListener('input', render);
document.getElementById('category-tags')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        render();
    }
});

render();