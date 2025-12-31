import productsData from './products.js';

// --- НАСТРОЙКИ TELEGRAM (Жестко заданы по вашему запросу) ---
const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o'; 
const chatId = '1017718880';

// Загрузка корзины из localStorage
let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || []; 

let currentCategory = 'all';
let visibleCount = 12;

// Функция сохранения
const saveCart = () => localStorage.setItem('rassvet_cart', JSON.stringify(cart));

// === ВАЛИДАЦИЯ ===
const nameInput = document.getElementById('cart-name');
const phoneInput = document.getElementById('cart-phone');
const emailInput = document.getElementById('cart-email');

const formatPhone = (v) => {
    let x = v.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (!x[2]) return x[1] === '7' || x[1] === '8' ? '+7 (' : v;
    return !x[3] ? `+7 (${x[2]}` : `+7 (${x[2]}) ${x[3]}` + (x[4] ? `-${x[4]}` : '') + (x[5] ? `-${x[5]}` : '');
};

phoneInput?.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
    validateField(e.target, /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/);
});

const validateField = (el, reg) => {
    const isOk = reg.test(el.value);
    el.classList.toggle('valid', isOk);
    el.classList.toggle('invalid', !isOk && el.value.length > 0);
    return isOk;
};

// === ЛОГИКА КАТАЛОГА ===
function render() {
    const root = document.getElementById('catalog');
    if (!root) return;

    const search = document.getElementById('search-input')?.value.toLowerCase().trim() || "";
    const filtered = productsData.filter(p => 
        (currentCategory === 'all' || p.category === currentCategory) &&
        (p.name.toLowerCase().includes(search) || p.article.toLowerCase().includes(search))
    );

    root.innerHTML = filtered.slice(0, visibleCount).map(p => {
        const inCart = cart.find(i => i.article === p.article);
        const action = inCart 
            ? `<div class="qty-controls">
                <button class="qty-btn" onclick="window.updateQty('${p.article}', -1)">-</button>
                <div class="qty-val">${inCart.qty}</div>
                <button class="qty-btn" onclick="window.updateQty('${p.article}', 1)">+</button>
               </div>`
            : `<button class="btn-add" onclick="window.addToCart('${p.article}')">+</button>`;

        return `
            <div class="card">
                <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src)" onerror="this.src='https://via.placeholder.com/200x150?text=Запчасть'">
                <h3>${p.name}</h3>
                <span class="art-text">АРТ: ${p.article}</span>
                <div class="card-price">${p.price.toLocaleString()} ₽</div>
                <div class="btn-row">
                    <button class="btn-info" onclick="window.requestProduct('${p.article}')">Запросить</button>
                    ${action}
                </div>
            </div>`;
    }).join('');

    document.getElementById('show-more-box').style.display = filtered.length > visibleCount ? 'block' : 'none';
    updateCartDisplay();
}

// === КОРЗИНА ===
window.addToCart = (art) => {
    const prod = productsData.find(p => p.article === art);
    if (prod && !cart.find(i => i.article === art)) {
        cart.push({ ...prod, qty: 1 });
        saveCart();
        render();
    }
};

window.updateQty = (art, delta) => {
    const idx = cart.findIndex(i => i.article === art);
    if (idx !== -1) {
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        saveCart();
        render();
    }
};

window.requestProduct = (art) => {
    window.addToCart(art);
    document.getElementById('side-cart').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
};

function updateCartDisplay() {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-price');
    const listEl = document.getElementById('cart-items-list');

    countEl.innerText = cart.reduce((s, i) => s + i.qty, 0);
    totalEl.innerText = `${cart.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString()} ₽`;

    listEl.innerHTML = cart.length === 0 ? '<p style="text-align:center;color:#888;margin-top:50px;">Пусто</p>' : 
    cart.map(i => `
        <div class="cart-item-row">
            <img src="images/parts/${i.image}" onerror="this.src='https://via.placeholder.com/50x50'">
            <div class="cart-item-info">
                <div class="cart-item-name">${i.name}</div>
                <div class="cart-item-bottom">
                    <div class="cart-item-price">${i.price.toLocaleString()} ₽</div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="window.updateQty('${i.article}', -1)">-</button>
                        <div class="qty-val">${i.qty}</div>
                        <button class="qty-btn" onclick="window.updateQty('${i.article}', 1)">+</button>
                    </div>
                </div>
            </div>
        </div>`).join('');
}

// ОТПРАВКА
document.getElementById('cart-send-btn').onclick = async () => {
    if (cart.length === 0) return alert('Корзина пуста');
    if (!nameInput.classList.contains('valid') || !phoneInput.classList.contains('valid')) {
        document.getElementById('order-form').classList.add('shake-form');
        setTimeout(() => document.getElementById('order-form').classList.remove('shake-form'), 500);
        return;
    }

    const btn = document.getElementById('cart-send-btn');
    btn.disabled = true; btn.innerText = 'Отправка...';

    let msg = `🔥 <b>ЗАКАЗ</b>\n👤 ${nameInput.value}\n📞 ${phoneInput.value}\n✉️ ${emailInput.value}\n\n`;
    cart.forEach(i => msg += `• ${i.name} (${i.qty} шт) - ${i.price * i.qty} ₽\n`);
    msg += `\n💰 <b>ИТОГО: ${cart.reduce((s,i)=>s+(i.price*i.qty),0).toLocaleString()} ₽</b>`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
        });
        if (res.ok) {
            alert('Успешно отправлено!');
            cart = []; saveCart(); render();
            document.getElementById('side-cart').classList.remove('open');
            document.getElementById('cart-overlay').style.display = 'none';
        }
    } catch (e) { alert('Ошибка сети'); }
    btn.disabled = false; btn.innerText = 'Оформить заявку';
};

// СОБЫТИЯ
document.getElementById('load-more-btn').onclick = () => { visibleCount += 12; render(); };
document.getElementById('search-input').oninput = () => { visibleCount = 12; render(); };
document.getElementById('category-tags').onclick = (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12; render();
    }
};

document.getElementById('cart-trigger').onclick = () => {
    document.getElementById('side-cart').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
};
document.getElementById('cart-close').onclick = document.getElementById('cart-overlay').onclick = () => {
    document.getElementById('side-cart').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
};

window.zoomImage = (src) => {
    document.getElementById('zoomed-img').src = src;
    document.getElementById('image-modal').style.display = 'flex';
};

render();