import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let visibleCount = 12;
let selectedProd = { name: '', art: '' };

function render() {
    const root = document.getElementById('catalog');
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput.value.toLowerCase().trim();

    const filtered = productsData.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchValue) || p.article.toLowerCase().includes(searchValue);
        return matchesCategory && matchesSearch;
    });

    root.innerHTML = filtered.slice(0, visibleCount).map(p => `
        <div class="card">
            <img src="images/parts/${p.image}" onclick="window.zoomImage(this.src, '${p.name}')" onerror="this.src='https://via.placeholder.com/200x150'">
            <h3>${p.name}</h3>
            <p class="art-text">Арт: ${p.article}</p>
            <div class="card-price">${p.price.toLocaleString()} ₽</div>
            <div class="btn-row">
                <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить</button>
                <button class="btn-add" onclick="window.addToCart()"></button>
            </div>
        </div>
    `).join('');
}

window.zoomImage = (src, name) => {
    const modal = document.getElementById('image-modal');
    document.getElementById('zoomed-img').src = src;
    document.getElementById('zoom-caption').innerText = name;
    modal.style.display = 'flex';
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = name;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('modal').style.display = 'none';

window.addToCart = () => {
    const badge = document.getElementById('cart-count');
    badge.innerText = parseInt(badge.innerText) + 1;
};

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

document.getElementById('send-request-btn').addEventListener('click', async () => {
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const msg = `Заявка: ${selectedProd.name}\nИмя: ${name}\nТелефон: ${phone}`;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg })
    });
    alert('Отправлено!');
    window.closeModal();
});

document.getElementById('search-input').addEventListener('input', render);
document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        render();
    }
});

render();