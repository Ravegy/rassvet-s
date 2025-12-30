import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let selectedProd = { name: '', art: '' };

function render() {
    const root = document.getElementById('catalog');
    const search = document.getElementById('search-input').value.toLowerCase();

    const filtered = productsData.filter(p => {
        const mCat = currentCategory === 'all' || p.category === currentCategory;
        const mSearch = p.name.toLowerCase().includes(search) || p.article.toLowerCase().includes(search);
        return mCat && mSearch;
    });

    root.innerHTML = filtered.map(p => `
        <div class="card">
            <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
            <h3>${p.name}</h3>
            <p style="font-size: 0.8rem; color: #666;">Арт: ${p.article}</p>
            <div class="card-price">${p.price.toLocaleString()} ₽</div>
            <button class="btn-add" onclick="window.addToCart()">В корзину</button>
            <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить цену</button>
        </div>
    `).join('');
}

// Мобильное меню
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');
mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Глобальные функции
window.addToCart = () => {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = name + " (" + art + ")";
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

// Фильтры и поиск
document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        render();
    }
});

document.getElementById('search-input').addEventListener('input', render);

// Телеграм
document.getElementById('send-request-btn').addEventListener('click', async () => {
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const text = `Заявка: ${selectedProd.name}\nАрт: ${selectedProd.art}\nИмя: ${name}\nТел: ${phone}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`);
        alert("Запрос отправлен!");
        window.closeModal();
    } catch (e) {
        alert("Ошибка отправки");
    }
});

render();