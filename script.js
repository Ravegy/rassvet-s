document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSWW1kw6De7LtGdpg_wFUyJBWeapw_WtiaRZmmwreIFphLg6W_xv-ThZJL6_OmxIUN0U8sNGSiPpAa3/pub?output=csv';

    // 1. Пытаемся сразу загрузить данные из локальной памяти (для скорости)
    const cachedData = localStorage.getItem('rassvet_catalog_cache');
    if (cachedData) {
        try {
            productsData = JSON.parse(cachedData);
            renderCatalog(productsData);
            console.log('Каталог загружен из кэша');
        } catch (e) {
            console.error('Ошибка чтения кэша');
        }
    }

    // 2. Функция парсинга CSV
    function csvToJSON(csv) {
        const lines = csv.split('\n');
        const result = [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const obj = {};
            headers.forEach((header, s) => {
                let value = currentline[s] ? currentline[s].trim() : "";
                obj[header] = value.replace(/^"|"$/g, '');
            });
            result.push(obj);
        }
        return result;
    }

    // 3. Загружаем свежие данные из Google
    fetch(SHEET_CSV_URL)
        .then(response => {
            if (!response.ok) throw new Error("Сетевая ошибка");
            return response.text();
        })
        .then(csvText => {
            const freshData = csvToJSON(csvText);
            
            // Если данные изменились, обновляем экран и кэш
            if (JSON.stringify(freshData) !== JSON.stringify(productsData)) {
                productsData = freshData;
                localStorage.setItem('rassvet_catalog_cache', JSON.stringify(productsData));
                renderCatalog(productsData);
                console.log('Каталог обновлен из Google Таблиц');
            }
        })
        .catch((err) => {
            console.warn('Google таблицы недоступны, используем кэш или показываем заглушку');
            if (productsData.length === 0) {
                catalogContainer.innerHTML = `
                    <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; grid-column: 1/-1;">
                        <h3>Каталог запчастей</h3>
                        <p>В данный момент мы обновляем базу товаров.</p>
                        <p>Для заказа и уточнения цен звоните:</p>
                        <a href="tel:+79818881337" style="color: #222; font-weight: bold; font-size: 24px; text-decoration: none;">+7 (981) 888-13-37</a>
                    </div>
                `;
            }
        });

    function renderCatalog(items) {
        catalogContainer.innerHTML = '';
        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center; font-size: 1.2rem; background: rgba(0,0,0,0.5); padding: 20px;">Ничего не найдено.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            
            const waMessage = encodeURIComponent(`Здравствуйте! Меня интересует запчасть: ${product.name} (Арт: ${product.sku}). Есть в наличии?`);
            const waLink = `https://wa.me/79818881337?text=${waMessage}`;
            
            const imgPath = product.image ? `images/parts/${product.image}` : 'https://placehold.co/400x300?text=Komatsu';
            const priceNum = parseFloat(product.price);
            const displayPrice = !isNaN(priceNum) ? priceNum.toLocaleString() + ' ₽' : 'По запросу';

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imgPath}" class="product-img" onerror="this.src='https://placehold.co/400x300?text=Запчасть'">
                </div>
                <div class="product-sku">Арт: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${displayPrice}</div>
                <div style="display: flex; gap: 8px;">
                    <a href="tel:+79818881337" class="btn-order" style="flex: 1; padding: 10px; font-size: 11px; background: #222;">📞 Позвонить</a>
                    <a href="${waLink}" target="_blank" class="btn-order" style="flex: 1; padding: 10px; font-size: 11px; background: #25D366; color: white;">💬 WhatsApp</a>
                </div>
            `;
            catalogContainer.appendChild(card);
        });
    }

    searchInput.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        const filtered = productsData.filter(p => 
            (p.name && p.name.toLowerCase().includes(text)) || 
            (p.sku && p.sku.toLowerCase().includes(text))
        );
        renderCatalog(filtered);
    });
});