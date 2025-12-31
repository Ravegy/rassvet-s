import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o'; 
const chatId = '1017718880';

let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || []; 
let currentCategory = 'all';
let visibleCount = 12;

// --- 1. СИСТЕМА УВЕДОМЛЕНИЙ ---
window.showToast = (message, isError = false) => {
    const toast = document.getElementById('custom-toast');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.querySelector('.toast-icon');
    if (!toast) return;

    toastText.innerText = message;
    toast.style.borderColor = isError ? 'var(--error)' : 'var(--accent)';
    toastIcon.style.background = isError ? 'var(--error)' : 'var(--accent)';
    toastIcon.innerText = isError ? '!' : '✓';
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
};

// --- 2. СТРОГАЯ ВАЛИДАЦИЯ ---
const validators = {
    name: (el) => {
        const isValid = /^[a-zA-Zа-яА-ЯёЁ\s]{2,30}$/.test(el.value.trim());
        el.classList.toggle('valid', isValid);
        el.classList.toggle('invalid', !isValid && el.value.length > 0);
        return isValid;
    },
    email: (el) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        el.classList.toggle('valid', isValid);
        el.classList.toggle('invalid', !isValid && el.value.length > 0);
        return isValid;
    },
    phone: (el) => {
        let x = el.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        if (!x[2]) { el.value = x[1] === '7' || x[1] === '8' ? '+7 (' : el.value; }
        else { el.value = `+7 (${x[2]}` + (x[3] ? `) ${x[3]}` : '') + (x[4] ? `-${x[4]}` : '') + (x[5] ? `-${x[5]}` : ''); }
        const isValid = el.value.length === 18;
        el.classList.toggle('valid', isValid);
        el.classList.toggle('invalid', !isValid && el.value.length > 10);
        return isValid;
    }
};

document.addEventListener('input', (e) => {
    if (e.target.id.includes('name')) validators.name(e.target);
    if (e.target.id.includes('email')) validators.email(e.target);
    if (e.target.id.includes('phone')) validators.phone(e.target);
});

// --- 3. ЛОГИКА КОРЗИНЫ ---
function saveCart() { localStorage.setItem('rassvet_cart', JSON.stringify(cart)); }

window.addToCart = (name) => {
    const product = productsData.find(p => p.name === name);
    const inCart = cart.find(item => item.name === name);
    if (inCart) inCart.count++; else cart.push({ ...product, count: 1 });
    saveCart(); render();
    showToast('Товар добавлен в корзину');
};

window.changeCount = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (item) { item.count += delta; if (item.count < 1) cart = cart.filter(i => i.name !== name); }
    saveCart(); render();
};

// --- 4. РЕНДЕРИНГ ---
function render() {
    const grid = document.getElementById('products-grid');
    const cartList = document.getElementById('cart-items-list');
    if (!grid) return;

    const filtered = productsData.filter(p => currentCategory === 'all' || p.category === currentCategory)
                                .filter(p => p.name.toLowerCase().includes(document.getElementById('search-input').value.toLowerCase()));

    grid.innerHTML = filtered.slice(0, visibleCount).map(p => `
        <div class="product-card">
            <img src="images/${p.image}" alt="${p.name}" onclick="window.zoomImage(this.src)">
            <div class="product-info">
                <div class="category-label">${p.category}</div>
                <h3>${p.name}</h3>
                <p class="article">Арт: ${p.article}</p>
                <div class="card-bottom">
                    <span class="price">${p.price.toLocaleString()} ₽</span>
                    <button class="add-btn" onclick="addToCart('${p.name}')">+</button>
                </div>
            </div>
        </div>
    `).join('');

    const btnMore = document.getElementById('load-more-btn');
    if (btnMore) btnMore.style.display = visibleCount >= filtered.length ? 'none' : 'block';
    
    if (cartList) {
        cartList.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-bottom">
                        <div class="count-ctrl">
                            <button onclick="changeCount('${item.name}', -1)">-</button>
                            <span>${item.count}</span>
                            <button onclick="changeCount('${item.name}', 1)">+</button>
                        </div>
                        <span class="price">${(item.price * item.count).toLocaleString()} ₽</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
    document.getElementById('cart-total-price').innerText = `${total.toLocaleString()} ₽`;
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.count, 0);
}

// --- 5. ОТПРАВКА В TELEGRAM ---
window.sendOrder = async (isContactForm = false) => {
    let nameEl, phoneEl, emailEl, text;
    
    if (isContactForm) {
        nameEl = document.getElementById('fb-name');
        phoneEl = document.getElementById('fb-phone');
        if (!validators.name(nameEl) || !validators.phone(phoneEl)) {
            showToast('Заполните форму корректно', true); return;
        }
        text = `✉️ <b>ЗАПРОС С КОНТАКТОВ</b>\n👤 Имя: ${nameEl.value}\n📞 Тел: ${phoneEl.value}\n💬 Сообщение: ${document.getElementById('fb-message').value || '—'}`;
    } else {
        nameEl = document.getElementById('cart-name');
        phoneEl = document.getElementById('cart-phone');
        emailEl = document.getElementById('cart-email');
        if (!validators.name(nameEl) || !validators.phone(phoneEl) || !validators.email(emailEl)) {
            showToast('Проверьте данные в корзине', true); return;
        }
        if (cart.length === 0) { showToast('Корзина пуста', true); return; }
        const itemsText = cart.map(i => `• ${i.name} (${i.count}шт) - ${i.price * i.count}₽`).join('\n');
        text = `🛒 <b>НОВЫЙ ЗАКАЗ</b>\n👤 Имя: ${nameEl.value}\n📞 Тел: ${phoneEl.value}\n📧 Email: ${emailEl.value}\n📦 Товары:\n${itemsText}`;
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
        });
        if (res.ok) {
            showToast('Успешно отправлено!');
            if (!isContactForm) { cart = []; saveCart(); render(); closeCart(); }
            else { document.getElementById('contact-page-form').reset(); }
        }
    } catch (e) { showToast('Ошибка сети', true); }
};

// --- СОБЫТИЯ ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cart-send-btn')?.addEventListener('click', () => window.sendOrder(false));
    document.getElementById('fb-send-btn')?.addEventListener('click', () => window.sendOrder(true));
    document.getElementById('load-more-btn')?.addEventListener('click', () => { visibleCount += 12; render(); });
    document.getElementById('search-input')?.addEventListener('input', () => { visibleCount = 12; render(); });
    
    document.getElementById('category-tags')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat; render();
        }
    });

    const closeCart = () => {
        document.getElementById('side-cart')?.classList.remove('open');
        document.getElementById('cart-overlay').style.display = 'none';
    };
    document.getElementById('cart-trigger')?.addEventListener('click', () => {
        document.getElementById('side-cart').classList.add('open');
        document.getElementById('cart-overlay').style.display = 'block';
    });
    document.getElementById('cart-close')?.addEventListener('click', closeCart);
    document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

    render();
});

window.zoomImage = (src) => {
    const modal = document.getElementById('image-modal');
    document.getElementById('zoomed-img').src = src;
    modal.style.display = 'flex';
};