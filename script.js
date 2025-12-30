const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let allProducts = [];
let currentCategory = 'all';
let selectedProd = { name: '', art: '' };
let cartCount = 0;

// Загрузка данных
async function init() {
    try {
        const res = await fetch('./products.json');
        if (!res.ok) throw new Error("Файл не найден");
        allProducts = await res.json();
        render();
    } catch (e) {
        console.error(e);
        document.getElementById('catalog').innerHTML = "<p>Ошибка загрузки каталога</p>";
    }
}

// Отрисовка каталога
function render(data = allProducts) {
    const root = document.getElementById('catalog');
    
    // Сначала фильтруем по категории
    let filtered = currentCategory === 'all' 
        ? data 
        : data.filter(p => p.category === currentCategory);

    // Затем по поиску
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    if (searchVal) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchVal) || 
            p.article.toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        root.innerHTML = "<p style='grid-column: 1/-1; text-align: center; opacity: 0.5;'>Ничего не найдено</p>";
        return;
    }

    root.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div class="cat-label">${p.category}</div>
            <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/200x150?text=Нет+фото'">
            <h3>${p.name}</h3>
            
            <div class="meta-info">
                <div><span>Артикул:</span> <span class="art-val">${p.article}</span></div>
                <div><span>Наличие:</span> <span style="color:#4caf50">На складе</span></div>
            </div>

            <div class="price">${p.price.toLocaleString()} ₽</div>

            <div class="card-actions">
                <button class="btn-cart" onclick="addToCart('${p.name}')">В корзину</button>
                <button class="btn-req" onclick="openM('${p.name}', '${p.article}')">Запрос</button>
            </div>
        </div>
    `).join('');
}

// Фильтрация по категориям
document.getElementById('category-tags').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.cat;
        render();
    }
});

// Поиск
document.getElementById('search-input').addEventListener('input', () => render());

// Корзина
function addToCart(name) {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
    // Эффект всплывающего уведомления можно добавить тут
}

// Модальное окно
function openM(name, art) {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = name;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Телефонная маска
document.getElementById('user-phone').addEventListener('input', function(e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (!x[1]) { e.target.value = '+7 ('; return; }
    e.target.value = !x[3] ? '+7 (' + x[2] : '+7 (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
});

// Отправка в TG
document.getElementById('send-request-btn').addEventListener('click', async () => {
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const agreed = document.getElementById('user-agreed').checked;

    if (name.length < 2 || phone.length < 18 || !agreed) {
        alert("Заполните форму"); return;
    }

    const text = `📦 ЗАКАЗ: ${selectedProd.name}\n🆔 АРТ: ${selectedProd.art}\n👤 ИМЯ: ${name}\n📞 ТЕЛ: ${phone}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`);
        alert("Заявка отправлена!");
        closeModal();
    } catch (e) { alert("Ошибка"); }
});

init();