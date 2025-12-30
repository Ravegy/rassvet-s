// Конфигурация Telegram
const botToken = '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o';
const chatId = '1017718880';

let allProducts = [];
let selectedProd = { name: '', art: '' };
let cartCount = 0;

// Инициализация и загрузка данных
async function init() {
    const root = document.getElementById('catalog');
    try {
        // Используем относительный путь для корректной работы на хостинге
        const res = await fetch('products.json'); 
        
        if (!res.ok) {
            throw new Error(`Ошибка загрузки: ${res.status}`);
        }
        
        allProducts = await res.json();
        render(allProducts);
        
    } catch (e) {
        console.error("Ошибка каталога:", e);
        root.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255,0,0,0.1); border-radius: 20px;">
                <p style="color: #ff5722; font-weight: bold;">Каталог временно недоступен</p>
                <p style="font-size: 0.85rem; margin-top: 10px; opacity: 0.8;">
                    Проверьте наличие файла products.json в корне сайта.
                </p>
            </div>
        `;
    }
}

// Отрисовка товаров
function render(data) {
    const root = document.getElementById('catalog');
    
    if (!data || data.length === 0) {
        root.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Товары не найдены.</p>";
        return;
    }

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

// Работа с модальным окном
function openM(name, art) {
    selectedProd = { name, art };
    document.getElementById('modal-product-name').innerText = name + ` (${art})`;
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('user-phone').value = '+7 (';
    document.getElementById('user-name').focus();
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Маска для ввода телефона: +7 (XXX) XXX-XX-XX
document.getElementById('user-phone').addEventListener('input', function(e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (!x[1]) { e.target.value = '+7 ('; return; }
    e.target.value = !x[3] ? '+7 (' + x[2] : '+7 (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
});

// Отправка заявки в Telegram
document.getElementById('send-request-btn').addEventListener('click', async () => {
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value;
    const agreed = document.getElementById('user-agreed').checked;

    if (name.length < 2 || !email.includes('@') || phone.length < 18 || !agreed) {
        alert("Пожалуйста, заполните форму корректно и подтвердите согласие.");
        return;
    }

    const msg = `<b>ЗАЯВКА В РАССВЕТ-С</b>\n\n` +
                `<b>📦 ТОВАР:</b> ${selectedProd.name}\n` +
                `<b>🆔 АРТ:</b> <code>${selectedProd.art}</code>\n` +
                `--------------------------\n` +
                `<b>👤 КЛИЕНТ:</b> ${name}\n` +
                `<b>📧 EMAIL:</b> ${email}\n` +
                `<b>📱 ТЕЛЕФОН:</b> ${phone}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}&parse_mode=HTML`);
        
        if (response.ok) {
            alert("Запрос отправлен! Мы свяжемся с вами в ближайшее время.");
            cartCount++;
            document.getElementById('cart-count').innerText = cartCount;
            closeModal();
            // Сброс полей формы
            document.getElementById('user-name').value = '';
            document.getElementById('user-email').value = '';
            document.getElementById('user-phone').value = '';
            document.getElementById('user-agreed').checked = false;
        } else {
            throw new Error();
        }
    } catch {
        alert("Произошла ошибка при отправке. Попробуйте позвонить нам напрямую.");
    }
});

// Живой поиск по каталогу
document.getElementById('search-input').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(val) || 
        p.article.toLowerCase().includes(val)
    );
    render(filtered);
});

// Запуск при загрузке страницы

document.addEventListener('DOMContentLoaded', init);
