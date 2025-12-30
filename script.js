import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let visibleCount = 12; // 3 ряда по 4 товара
let selectedProd = { name: '', art: '' };

function render() {
    const root = document.getElementById('catalog');
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const btnBox = document.getElementById('show-more-box');

    const filtered = productsData.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchValue) || 
                              p.article.toLowerCase().includes(searchValue);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        root.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #444;">Товары не найдены</div>`;
        if (btnBox) btnBox.style.display = 'none';
        return;
    }

    // Отрисовка с учетом лимита и анимации
    root.innerHTML = filtered.map((p, index) => {
        const isHidden = index >= visibleCount ? 'hidden' : '';
        // Задержка появления для эффекта "волны" (только для видимых)
        const delay = isHidden ? 0 : (index % 12) * 0.05; 
        return `
            <div class="card ${isHidden}" style="animation-delay: ${delay}s">
                <div class="card-top">
                    <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/240x180?text=Нет+фото'">
                    <h3>${p.name}</h3>
                    <p style="font-size: 0.85rem; color: #666; margin-top:8px;">Арт: ${p.article}</p>
                </div>
                <div class="card-bottom">
                    <div class="card-price" style="font-size: 1.5rem; font-weight: 800; color: var(--accent); margin: 20px 0;">
                        ${p.price.toLocaleString()} ₽
                    </div>
                    <button class="btn-add" onclick="window.addToCart()">В корзину</button>
                    <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить цену</button>
                </div>
            </div>
        `;
    }).join('');

    if (btnBox) {
        btnBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
    }
}

// Маска телефона
document.getElementById('user-phone').addEventListener('input', (e) => {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    e.target.value = !x[2] ? x[1] : '+' + x[1] + ' (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
});

// Отправка данных
async function sendToTelegram() {
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    const phoneInput = document.getElementById('user-phone');
    
    if (nameInput.value.length < 2 || phoneInput.value.length < 16) {
        return alert('Заполните все поля корректно');
    }

    const msg = `🚀 *НОВЫЙ ЗАКАЗ*\n\n📦 *Товар:* ${selectedProd.name}\n🔢 *Арт:* ${selectedProd.art}\n───\n👤 *Имя:* ${nameInput.value}\n📧 *Email:* ${emailInput.value}\n📞 *Тел:* ${phoneInput.value}`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        });
        if (res.ok) {
            alert('Заявка принята!');
            window.closeModal();
            nameInput.value = ''; emailInput.value = ''; phoneInput.value = '';
        }
    } catch (err) { alert('Ошибка сети'); }
}

// Слушатели событий
document.getElementById('send-request-btn').addEventListener('click', sendToTelegram);
document.getElementById('load-more-btn').addEventListener('click', () => { visibleCount += 8; render(); });
document.getElementById('search-input').addEventListener('input', () => { visibleCount = 12; render(); });

document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12; render();
    }
});

// Глобальные функции
window.addToCart = () => {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
    const cart = document.querySelector('.floating-cart');
    cart.style.transform = 'scale(1.2)';
    setTimeout(() => cart.style.transform = 'scale(1)', 200);
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = `${name} (арт. ${art})`;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('modal').style.display = 'none';

document.getElementById('mobile-menu').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

// Инициализация
render();