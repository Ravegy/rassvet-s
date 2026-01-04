document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // На GitHub Pages лучше использовать относительный путь './'
    const DATA_URL = './products.json';

    console.log('Попытка загрузки данных из:', DATA_URL);

    // 1. Загружаем данные
    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Сервер ответил кодом ${response.status}. Возможно, файл products.json отсутствует.`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Данные успешно загружены:', data);
            productsData = data;
            renderCatalog(productsData);
        })
        .catch(error => {
            console.error('Ошибка fetch:', error);
            catalogContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; grid-column: 1/-1; color: black;">
                    <h3 style="color: #d32f2f;">Ошибка: Каталог не найден</h3>
                    <p>Браузер не смог найти файл <b>products.json</b>.</p>
                    <p style="font-size: 13px; color: #666;">Подробности: ${error.message}</p>
                </div>
            `;
        });

    // 2. Функция отрисовки
    function renderCatalog(items) {
        catalogContainer.innerHTML = '';
        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center;">Ничего не найдено</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            
            // Если картинка не указана в JSON, используем заглушку
            const imgPath = product.image ? `images/parts/${product.image}` : 'https://placehold.co/400x300?text=No+Photo';

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imgPath}" alt="${product.name}" class="product-img" onerror="this.src='https://placehold.co/400x300?text=Нет+фото'">
                </div>
                <div class="product-sku">Арт: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)} ₽</div>
                <a href="tel:+79818881337" class="btn-order">Заказать</a>
            `;
            catalogContainer.appendChild(card);
        });
    }

    // 3. Поиск
    searchInput.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        const filtered = productsData.filter(p => 
            p.name.toLowerCase().includes(text) || p.sku.toLowerCase().includes(text)
        );
        renderCatalog(filtered);
    });

    function formatPrice(p) {
        return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
});