document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // Используем относительный путь для корректной работы на GitHub
    const url = './products.json';

    // 1. Загружаем данные из внешнего файла
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status} (Файл не найден)`);
            }
            return response.json();
        })
        .then(data => {
            productsData = data;
            renderCatalog(productsData);
        })
        .catch(error => {
            console.error('Критическая ошибка:', error);
            catalogContainer.innerHTML = `
                <div style="background: rgba(255,255,255,0.9); padding: 30px; border-radius: 10px; text-align: center; grid-column: 1/-1;">
                    <h3 style="color: #d32f2f; margin-top: 0;">Каталог временно недоступен</h3>
                    <p>Проверьте, что файл <b>products.json</b> загружен на GitHub в ту же папку, что и сайт.</p>
                    <p style="font-size: 12px; color: #666;">Техническая ошибка: ${error.message}</p>
                </div>
            `;
        });

    // 2. Функция отрисовки товаров
    function renderCatalog(items) {
        catalogContainer.innerHTML = '';

        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="background: white; padding: 20px; border-radius: 5px; grid-column: 1/-1; text-align: center;">Товары не найдены.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');

            // Путь к картинке: images/parts/название.jpg
            // Если в JSON поле image пустое, используем заглушку
            const imageFileName = product.image ? product.image : 'no-image.png';
            const imagePath = `images/parts/${imageFileName}`;

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imagePath}" 
                         alt="${product.name}" 
                         class="product-img" 
                         onerror="this.src='https://placehold.co/400x300?text=Нет+фото'">
                </div>
                
                <div class="product-sku">Арт: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)} ₽</div>
                <a href="tel:+79818881337" class="btn-order">Заказать запчасть</a>
            `;
            catalogContainer.appendChild(card);
        });
    }

    // 3. Живой поиск по названию и артикулу
    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        
        const filteredProducts = productsData.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(searchText);
            const skuMatch = product.sku.toLowerCase().includes(searchText);
            return nameMatch || skuMatch;
        });

        renderCatalog(filteredProducts);
    });

    // Вспомогательная функция: делает из 15000 -> 15 000
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
});