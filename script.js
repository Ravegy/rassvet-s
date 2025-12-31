import productsData from './products.js';

// --- НАСТРОЙКИ TELEGRAM ---
const botToken = 'ВАШ_ТОКЕН_БОТА'; 
const chatId = 'ВАШ_ID_ЧАТА';

// Загружаем корзину из памяти браузера при старте или создаем пустой массив
let cart = JSON.parse(localStorage.getItem('rassvet_cart')) || []; 

let currentCategory = 'all';
let visibleCount = 12;

// Функция сохранения корзины в localStorage
function saveCart() {
    localStorage.setItem('rassvet_cart', JSON.stringify(cart));
}

// === ЛОГИКА ВАЛИДАЦИИ ===
const nameInput = document.getElementById('cart-name');
const phoneInput = document.getElementById('cart-phone');
const emailInput = document.getElementById('cart-email');

const formatPhone = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 2) return `+7 (${phoneNumber.slice(1)}`;
    if (phoneNumberLength < 5) return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4)}`;
    if (phoneNumberLength < 8) return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
};

phoneInput?.addEventListener('input', (e) => {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
    validateField(e.target, /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/);
});

emailInput?.addEventListener('input', (e) => {
    validateField(e.target, /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/);
});

nameInput?.addEventListener('input', (e) => {
    validateField(e.target, /^[а-яА-Яa-zA-Z\s]{2,}$/);
});

function validateField(input, regex) {
    if (regex.test(input.value)) {
        input.classList.add('valid');
        input.classList.remove('invalid');
        return true;
    } else {
        if(input.value.length > 0) {
            input.classList.add('invalid');
            input.classList.remove('valid');
        } else {
            input.classList.remove('invalid', 'valid');
        }
        return false;
    }
}

// === ОСНОВНАЯ ЛОГИКА ===

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
            : `<button class="btn-add" onclick="window.addToCart('${p.article}')">+</button>`;

        return `
            <div class="card">
                <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src)" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
                <h3>${p.name}</h3>
                <span class="art-text">${p.article}</span>
                <div class="card-price">${p.price.toLocaleString()} ₽</div>
                <div class="btn-row">
                    <button class="btn-info" onclick="window.requestProduct('${p.article}')">Запросить</button>
                    ${cartAction}
                </div>
            </div>
        `;
    }).join('');

    const showMoreBox = document.getElementById('show-more-box');
    if (showMoreBox) {
        showMoreBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
    }
    updateCartDisplay();
}

window.addToCart = (article) => {
    const product = productsData.find(p => p.article === article);
    if (product) {
        const existing = cart.find(i => i.article === article);
        if (!existing) {
            cart.push({ ...product, qty: 1 });
        }
        saveCart(); // Сохраняем изменения
        render();
    }
};

window.updateQty = (article, delta) => {
    const index = cart.findIndex(i => i.article === article);
    if (index !== -1) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        saveCart(); // Сохраняем изменения
        render();
    }
};

window.requestProduct = (article) => {
    if (!cart.find(i => i.article === article)) window.addToCart(article);
    document.getElementById('side-cart').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
};

function updateCartDisplay() {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-price');
    const listEl = document.getElementById('cart-items-list');

    if (countEl) countEl.innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    if (totalEl) totalEl.innerText = `${cart.reduce((sum, i) => sum + (i.price * i.qty), 0).toLocaleString()} ₽`;

    if (listEl) {
        listEl.innerHTML = cart.length === 0 
            ? '<p style="text-align:center; color:#555; margin-top:50px;">Корзина пуста</p>' 
            : cart.map(item => `
                <div class="cart-item-row">
                    <img src="images/parts/${item.image}" onerror="this.src='https://via.placeholder.com/50x50'">
                    <div style="flex:1">
                        <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-bottom:5px;">${item.name}</div>
                        <div style="font-size:0.85rem; color:var(--accent);">${item.price.toLocaleString()} ₽</div>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="window.updateQty('${item.article}', -1)">-</button>
                        <div class="qty-val">${item.qty}</div>
                        <button class="qty-btn" onclick="window.updateQty('${item.article}', 1)">+</button>
                    </div>
                </div>
            `).join('');
    }
}

// ОТПРАВКА В TELEGRAM
document.getElementById('cart-send-btn').onclick = async () => {
    const isNameValid = nameInput.classList.contains('valid');
    const isPhoneValid = phoneInput.classList.contains('valid');
    const isEmailValid = emailInput.classList.contains('valid');

    if (cart.length === 0) return alert('Корзина пуста!');

    if (!isNameValid || !isPhoneValid || !isEmailValid) {
        const form = document.getElementById('order-form');
        form.classList.add('shake-form');
        setTimeout(() => form.classList.remove('shake-form'), 500);
        return;
    }

    let msg = `🔥 <b>НОВЫЙ ЗАКАЗ</b>\n\n👤 Имя: ${nameInput.value}\n📞 Тел: ${phoneInput.value}\n✉️ Email: ${emailInput.value}\n\n📦 <b>Товары:</b>\n`;
    let total = 0;

    cart.forEach(item => {
        const sum = item.price * item.qty;
        total += sum;
        msg += `🔹 ${item.name}\n   ${item.qty} шт. x ${item.price} = ${sum} ₽\n\n`;
    });
    msg += `💰 <b>ИТОГО: ${total.toLocaleString()} ₽</b>`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
        });

        if (res.ok) {
            alert('Заказ отправлен!');
            cart = [];
            saveCart(); // Очищаем хранилище после заказа
            closeCart();
            render();
        }
    } catch (e) { alert('Ошибка сети'); }
};

// СОБЫТИЯ
document.getElementById('load-more-btn')?.addEventListener('click', () => { visibleCount += 12; render(); });
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

const closeCart = () => {
    document.getElementById('side-cart').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
};

document.getElementById('cart-trigger').onclick = () => {
    document.getElementById('side-cart').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
};
document.getElementById('cart-close').onclick = closeCart;
document.getElementById('cart-overlay').onclick = closeCart;

window.zoomImage = (src) => {
    document.getElementById('zoomed-img').src = src;
    document.getElementById('image-modal').style.display = 'flex';
};

// Первый запуск
render();