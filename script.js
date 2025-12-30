import productsData from './products.js';

let currentCategory = 'all';
let cartCount = 0;
// Лимит 12 товаров = 3-4 строки в зависимости от ширины экрана
let visibleCount = 12; 
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
                    <p style="font-size: 0.8rem; color: #666; margin-top:5px;">Арт: ${p.article}</p>
                </div>
                <div class="card-bottom">
                    <div class="card-price" style="font-size: 1.4rem; font-weight: bold; color: var(--accent); margin: 15px 0;">
                        ${p.price.toLocaleString()} ₽
                    </div>
                    <button class="btn-add" onclick="window.addToCart()">В корзину</button>
                    <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить цену</button>
                </div>
            </div>
        `;
    }).join('');

    btnBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
}

// Кнопка "Показать еще" добавляет по 8 товаров (2 строки)
document.getElementById('load-more-btn').addEventListener('click', () => {
    visibleCount += 8; 
    render();
});

window.addToCart = () => {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
    // Анимация корзины
    const cart = document.querySelector('.floating-cart');
    cart.style.transform = 'scale(1.3)';
    setTimeout(() => cart.style.transform = 'scale(1)', 200);
};

window.openM = (name, art) => {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = `${name} (${art})`;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

document.getElementById('search-input').addEventListener('input', () => {
    visibleCount = 12; 
    render();
});

document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12; 
        render();
    }
});

document.getElementById('mobile-menu').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

render();