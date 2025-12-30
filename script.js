const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let allProducts = [];
let selectedProd = { name: '', art: '' };
let cartCount = 0;

// Загрузка только из файла
async function init() {
    try {
        const res = await fetch('products.json');
        if (!res.ok) throw new Error();
        allProducts = await res.json();
        render(allProducts);
    } catch (e) {
        document.getElementById('catalog').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: #ff5722;">Каталог временно недоступен.</p>
                <p style="font-size: 0.8rem; opacity: 0.6;">Запустите сайт через Live Server или загрузите на хостинг.</p>
            </div>`;
    }
}

function render(data) {
    const root = document.getElementById('catalog');
    root.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="images/parts/${p.image}" onerror="this.src='https://via.placeholder.com/250x160?text=Запчасть'">
            <div class="article">APT: ${p.article}</div>
            <h3>${p.name}</h3>
            <div class="price">${p.price.toLocaleString()} ₽</div>
            <button class="btn-buy" onclick="openM('${p.name}', '${p.article}')">Запросить</button>
        </div>
    `).join('');
}

function openM(name, art) {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = name + ` (${art})`;
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('user-phone').value = '+7 (';
    document.getElementById('user-name').focus();
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

// Маска телефона
document.getElementById('user-phone').addEventListener('input', function(e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (!x[1]) { e.target.value = '+7 ('; return; }
    e.target.value = !x[3] ? '+7 (' + x[2] : '+7 (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
});

// Отправка
document.getElementById('send-request-btn').addEventListener('click', async () => {
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value;
    const agreed = document.getElementById('user-agreed').checked;

    if (name.length < 2 || !email.includes('@') || phone.length < 18 || !agreed) {
        return alert("Заполните все поля и подтвердите согласие");
    }

    const msg = `<b>ЗАЯВКА В РАССВЕТ-С</b>\n\n` +
                `<b>📦 ТОВАР:</b> ${selectedProd.name}\n` +
                `<b>🆔 АРТ:</b> <code>${selectedProd.art}</code>\n` +
                `--------------------------\n` +
                `<b>👤 КЛИЕНТ:</b> ${name}\n` +
                `<b>📧 EMAIL:</b> ${email}\n` +
                `<b>📱 ТЕЛЕФОН:</b> ${phone}`;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}&parse_mode=HTML`);
        alert("Запрос отправлен!");
        cartCount++;
        document.getElementById('cart-count').innerText = cartCount;
        closeModal();
    } catch { alert("Ошибка при отправке"); }
});

// Поиск
document.getElementById('search-input').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    render(allProducts.filter(p => p.name.toLowerCase().includes(val) || p.article.toLowerCase().includes(val)));
});

init();