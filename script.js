import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let selectedProd = { name: '', art: '' };

// Отрисовка
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
            <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/240x180?text=Нет+фото'">
            <h3>${p.name}</h3>
            <p style="color: #666; font-size: 0.8rem; margin-bottom: 10px;">Артикул: ${p.article}</p>
            <div class="card-price">${p.price.toLocaleString()} ₽</div>
            <div class="card-btns">
                <button class="btn-add" onclick="window.addToCart()">В корзину</button>
                <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запрос</button>
            </div>
        </div>
    `).join('');
}

// Мобильное меню
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : 'auto';
});

// Глобальные функции
window.addToCart = () => {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = name + " (Арт: " + art + ")";
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

// Фильтры
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
    
    if (name.length < 2 || phone.length < 10) {
        alert("Заполните корректно имя и телефон");
        return;
    }

    const text = `📦 НОВЫЙ ЗАКАЗ\nТовар: ${selectedProd.name}\nАрт: ${selectedProd.art}\nИмя: ${name}\nТел: ${phone}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`);
        alert("Запрос успешно отправлен!");
        window.closeModal();
    } catch (e) {
        alert("Ошибка при отправке");
    }
});

render();