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

    const searchValue = document.getElementById('search-input')?.value.toLowerCase().trim() || "";
    const filtered = productsData.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchValue) || p.article.toLowerCase().includes(searchValue);
        return matchesCategory && matchesSearch;
    });

    root.innerHTML = filtered.map((p, index) => {
        const isHidden = index >= visibleCount ? 'hidden' : '';
        return `
            <div class="card ${isHidden}">
                <div class="card-top">
                    <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/200x140?text=Запчасть'">
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

    document.getElementById('show-more-box').style.display = filtered.length > visibleCount ? 'block' : 'none';
}

window.addToCart = () => {
    cartCount++;
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = cartCount;
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerHTML = `${name} <span>Артикул: ${art}</span>`;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('modal').style.display = 'none';

async function sendRequest() {
    const name = document.getElementById('user-name').value.trim();
    const phone = document.getElementById('user-phone').value.trim();

    if (!name || phone.length < 18) return alert('Заполните данные корректно');

    const msg = `🚀 ЗАЯВКА\n📦 Товар: ${selectedProd.name}\n🔢 Арт: ${selectedProd.art}\n👤 Имя: ${name}\n📞 Тел: ${phone}`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg })
        });
        if (res.ok) {
            alert('Заявка отправлена!');
            window.closeModal();
        }
    } catch (e) { alert('Ошибка сети'); }
}

// Маска телефона
document.getElementById('user-phone')?.addEventListener('input', (e) => {
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

document.getElementById('send-request-btn')?.addEventListener('click', sendRequest);
document.getElementById('load-more-btn')?.addEventListener('click', () => { visibleCount += 8; render(); });
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