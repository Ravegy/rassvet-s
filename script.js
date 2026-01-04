document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // Загрузка данных из внешнего файла JSON
    fetch('./products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            productsData = data;
            renderCatalog(productsData);
        })
        .catch(error => {
            console.error('Ошибка загрузки:', error);
            // Сообщение об ошибке, если файл не грузится (например, из-за CORS)
            catalogContainer.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; color: red;">
                    <h3>Не удалось загрузить каталог</h3>
                    <p>Если вы открыли файл index.html с компьютера, браузер заблокировал загрузку базы данных.</p>
                    <p>Пожалуйста, используйте "Live Server" или загрузите сайт на хостинг.</p>
                </div>
            `;
        });

    // Функция отрисовки каталога
    function renderCatalog(items) {
        catalogContainer.innerHTML = '';

        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="background: white; padding: 20px; border-radius: 5px; grid-column: 1/-1; text-align: center;">Ничего не найдено.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');

            // Путь к картинке: images/parts/ИМЯ_ФАЙЛА
            // Если картинки нет, подставляем заглушку
            const imagePath = product.image ? `images/parts/${product.image}` : 'images/no-image.png';

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imagePath}" 
                         alt="${product.name}" 
                         class="product-img" 
                         onerror="this.src='https://placehold.co/300x220?text=Нет+фото'">
                </div>
                
                <div class="product-sku">Арт: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)} ₽</div>
                <a href="tel:+79818881337" class="btn-order">Заказать</a>
            `;
            catalogContainer.appendChild(card);
        });
    }

    // Поиск
    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        const filteredProducts = productsData.filter(product => {
            return product.name.toLowerCase().includes(searchText) || 
                   product.sku.toLowerCase().includes(searchText);
        });
        renderCatalog(filteredProducts);
    });

    // Вспомогательная функция для красивой цены (18 000 вместо 18000)
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
});