import productsData from './products.js';

// Конфигурация Telegram
const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let visibleCount = 12; // 3 ряда по 4 товара (базовое ограничение)
let selectedProd = { name: '', art: '' };

function render() {
    const root = document.getElementById('catalog');
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const btnBox = document.getElementById('show-more-box');

    // Фильтрация данных
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

    // Генерация карточек
    root.innerHTML = filtered.map((p, index) => {
        const isHidden = index >= visibleCount ? 'hidden' : '';
        // Эффект появления "лесенкой" (stagger)
        const delay = isHidden ? 0 : (index % 12) * 0.06; 
        return `
            <div class="card ${isHidden}" style="animation-delay: ${delay}s">
                <div class="card-top">
                    <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/240x180?text=Нет+фото'">
                    <h3>${p.name}</h3>
                    <p style="font-size: 0.8rem; color: #666; margin-top:5px;">Арт: ${p.article}</p>
                </div>
                <div class="card-bottom">
                    <div class="card-price">
                        ${p.price.toLocaleString()} ₽
                    </div>
                    <div class="btn-row">
                        <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить</button>
                        <button class="btn-add" onclick="window.addToCart()" title="В корзину">
                            <span style="font-size: 1.2rem;">🛒</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Управление кнопкой "Показать еще"
    if (btnBox) {
        btnBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
    }
}

// Маска для номера телефона
document.getElementById('user-phone').addEventListener('input', (e) => {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    e.target.value = !x[2] ? x[1] : '+' + x[1] + ' (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
});

// Функция отправки в Telegram
async function sendToTelegram() {
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    const phoneInput = document.getElementById('user-phone');
    
    if (nameInput.value.length < 2 || phoneInput.value.length < 16) {
        return alert('Пожалуйста, заполните форму корректно');
    }

    const msg = `🚀 *ЗАПРОС ЦЕНЫ*\n\n📦 *Товар:* ${selectedProd.name}\n🔢 *Арт:* ${selectedProd.art}\n───\n👤 *Имя:* ${nameInput.value}\n📧 *Email:* ${emailInput.value}\n📞 *Тел:* ${phoneInput.value}`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        });
        if (res.ok) {
            alert('Ваш запрос успешно отправлен!');
            window.closeModal();
            nameInput.value = ''; emailInput.value = ''; phoneInput.value = '';
        }
    } catch (err) { alert('Ошибка при отправке. Попробуйте снова.'); }
}

// Обработчики событий
document.getElementById('send-request-btn').addEventListener('click', sendToTelegram);
document.getElementById('load-more-btn').addEventListener('click', () => { 
    visibleCount += 8; // Добавляем по 2 ряда
    render(); 
});
document.getElementById('search-input').addEventListener('input', () => { 
    visibleCount = 12; // Сброс при поиске
    render(); 
});

document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12; // Сброс лимита при смене категории
        render();
    }
});

// Глобальные методы (через window для доступа из HTML)
window.addToCart = () => {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
    const cart = document.querySelector('.floating-cart');
    cart.style.transform = 'scale(1.3) rotate(-10deg)';
    setTimeout(() => cart.style.transform = 'scale(1)', 200);
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = `${name} (арт. ${art})`;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

// Мобильное меню
document.getElementById('mobile-menu').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

// Первый запуск
render();