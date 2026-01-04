document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // 1. Загружаем данные
    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            productsData = data;
            renderCatalog(productsData);
        })
        .catch(error => console.error('Ошибка загрузки товаров:', error));

    // 2. Функция отрисовки товаров (ОБНОВЛЕНА)
    function renderCatalog(items) {
        catalogContainer.innerHTML = '';

        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="background: white; padding: 20px; border-radius: 5px;">По вашему запросу ничего не найдено.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');

            // Формируем путь к картинке. 
            // Если в JSON картинка не указана, можно подставить заглушку (пока оставил пустой).
            const imagePath = product.image ? `images/parts/${product.image}` : 'images/no-image.png'; 

            card.innerHTML = `
                <img src="${imagePath}" alt="${product.name}" class="product-img" onerror="this.src='images/no-image.png'">
                
                <div class="product-sku">Артикул: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${product.price} ₽</div>
                <a href="tel:+79818881337" class="btn-order">Позвонить и заказать</a>
            `;
            catalogContainer.appendChild(card);
        });
    }

    // 3. Живой поиск (без изменений)
    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const filteredProducts = productsData.filter(product => {
            return product.name.toLowerCase().includes(searchText) || 
                   product.sku.toLowerCase().includes(searchText);
        });
        renderCatalog(filteredProducts);
    });
});