import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let visibleCount = 12; 
let selectedProd = { name: '', art: '' };

function render() {
    const root = document.getElementById('catalog');
    if (!root) return;

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
        root.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #444; font-size: 1rem;">Ничего не найдено</div>`;
        if (btnBox) btnBox.style.display = 'none';
        return;
    }

    root.innerHTML = filtered.map((p, index) => {
        const isHidden = index >= visibleCount ? 'hidden' : '';
        const delay = isHidden ? 0 : (index % 12) * 0.04; 
        return `
            <div class="card ${isHidden}" style="animation-delay: ${delay}s">
                <div class="card-top">
                    <img src="images/parts/${p.image}" 
                         onclick="window.zoomImage(this.src, '${p.name.replace(/'/g, "\\'")}')" 
                         style="cursor: zoom-in;"
                         onerror="this.src='https://via.placeholder.com/200x140?text=Запчасть'">
                    <h3>${p.name}</h3>
                    <span class="art-text">Арт: ${p.article}</span>
                </div>
                <div class="card-bottom">
                    <div class="card-price">${p.price.toLocaleString()} ₽</div>
                    <div class="btn-row">
                        <button class="btn-info" onclick="window.openM('${p.name.replace(/'/g, "\\'")}', '${p.article}')">Запросить</button>
                        <button class="btn-add" onclick="window.addToCart()" title="В корзину"></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (btnBox) {
        btnBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
    }
}

// Глобальные функции для работы из HTML
window.addToCart = () => {
    cartCount++;
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = cartCount;
        badge.style.transform = 'scale(1.4)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
};

window.zoomImage = (src, name) => {
    const modal = document.getElementById('image-modal');
    const zoomedImg = document.getElementById('zoomed-img');
    const caption = document.getElementById('zoom-caption');
    if (modal && zoomedImg && caption) {
        zoomedImg.src = src;
        caption.innerText = name;
        modal.style.display = 'flex';
    }
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    const modalTitle = document.getElementById('modal-product-name');
    if (modalTitle) {
        modalTitle.innerHTML = `${name} <span>Артикул: ${art}</span>`;
    }
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

async function sendRequest() {
    const name = document.getElementById('user-name').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const email = document.getElementById('user-email').value.trim();

    if (!name || !phone) return alert('Пожалуйста, заполните Имя и Телефон');

    const msg = `🚀 ЗАЯВКА\n📦 Товар: ${selectedProd.name}\n🔢 Арт: ${selectedProd.art}\n👤 Имя: ${name}\n📞 Тел: ${phone}\n✉️ Почта: ${email}`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg })
        });
        if (res.ok) {
            alert('Заявка успешно отправлена!');
            window.closeModal();
        }
    } catch (e) { alert('Ошибка соединения'); }
}

// Маска телефона
document.getElementById('user-phone')?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value || value[0] !== '7') value = '7' + value;
    value = value.substring(0, 11);
    let result = '+7';
    if (value.length > 1) result += ' (' + value.substring(1, 4);
    if (value.length >= 5) result += ') ' + value.substring(4, 7);
    if (value.length >= 8) result += '-' + value.substring(7, 9);
    if (value.length >= 10) result += '-' + value.substring(9, 11);
    e.target.value = result;
});

document.getElementById('send-request-btn')?.addEventListener('click', sendRequest);
document.getElementById('load-more-btn')?.addEventListener('click', () => { visibleCount += 8; render(); });
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