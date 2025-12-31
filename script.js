import productsData from './products.js';

const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let currentCategory = 'all';
let cartCount = 0;
let visibleCount = 12;

function render() {
    const root = document.getElementById('catalog');
    if (!root) return;
    
    const searchValue = document.getElementById('search-input')?.value.toLowerCase().trim() || "";
    
    const filtered = productsData.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchValue) || p.article.toLowerCase().includes(searchValue);
        return matchesCategory && matchesSearch;
    });

    root.innerHTML = filtered.slice(0, visibleCount).map(p => `
        <div class="card">
            <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/200x140?text=Запчасть'">
            <h3>${p.name}</h3>
            <span class="art-text">Арт: ${p.article}</span>
            <div class="card-bottom">
                <div class="card-price">${p.price.toLocaleString()} ₽</div>
                <div class="btn-row">
                    <button class="btn-info" onclick="window.openM('${p.name}', '${p.article}')">Запросить</button>
                    <button class="btn-add" onclick="window.addToCart()" title="В корзину">
                        <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const btnBox = document.getElementById('show-more-box');
    if (btnBox) btnBox.style.display = filtered.length > visibleCount ? 'block' : 'none';
}

// Утилиты
window.addToCart = () => {
    cartCount++;
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = cartCount;
        badge.style.transform = 'scale(1.3)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
};

window.openM = (name, art) => {
    const modalTitle = document.getElementById('modal-product-name');
    if (modalTitle) modalTitle.innerText = name;
    document.getElementById('modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('modal').style.display = 'none';
};

// События
document.getElementById('search-input')?.addEventListener('input', () => {
    visibleCount = 12;
    render();
});

document.getElementById('category-tags')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        visibleCount = 12;
        render();
    }
});

document.getElementById('load-more-btn')?.addEventListener('click', () => {
    visibleCount += 8;
    render();
});

// Меню
const menuToggle = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-list');

menuToggle?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
});

// Автозакрытие меню при клике на ссылку
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu?.classList.remove('active');
    });
});

// Инициализация
render();