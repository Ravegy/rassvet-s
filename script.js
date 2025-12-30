import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let visibleCount = 12; // Показываем 12 товаров изначально
let selectedProd = { name: '', art: '' };

function render() {
    const root = document.getElementById('catalog');
    const search = document.getElementById('search-input').value.toLowerCase();
    const btnBox = document.getElementById('show-more-box');

    const filtered = productsData.filter(p => {
        const mCat = currentCategory === 'all' || p.category === currentCategory;
        const mSearch = p.name.toLowerCase().includes(search) || p.article.toLowerCase().includes(search);
        return mCat && mSearch;
    });

    root.innerHTML = filtered.map((p, index) => {
        const isHidden = index >= visibleCount ? 'hidden' : '';
        return `
            <div class="card ${isHidden}">
                <div class="card-top">
                    <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
                    <h3>${p.name}</h3>
                    <p style="font-size: 0.8rem; color: #666;">Арт: ${p.article}</p>
                </div>
                <div class="card-bottom">
                    <div class="card-price">${p.price.toLocaleString()} ₽</div>
                    <button class="btn-add" onclick="window.addToCart()">В корзину</button>
                    <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить цену</button>
                </div>
            </div>
        `;
    }).join('');

    // Показываем кнопку только если есть что скрывать
    btnBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
}

// Кнопка "Показать еще"
document.getElementById('load-more-btn').addEventListener('click', () => {
    visibleCount += 8; // Добавляем еще 8 товаров
    render();
});

// Глобальные функции для кнопок в карточках
window.addToCart = () => {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = `${name} (${art})`;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

// Поиск и фильтрация
document.getElementById('search-input').addEventListener('input', () => {
    visibleCount = 12; // Сбрасываем лимит при поиске
    render();
});

document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12; // Сбрасываем лимит при смене категории
        render();
    }
});

// Бургер-меню
document.getElementById('mobile-menu').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

// Старт
render();