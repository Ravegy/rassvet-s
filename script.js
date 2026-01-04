document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // Ваша ссылка на CSV
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSWW1kw6De7LtGdpg_wFUyJBWeapw_WtiaRZmmwreIFphLg6W_xv-ThZJL6_OmxIUN0U8sNGSiPpAa3/pub?output=csv';

    // Функция преобразования CSV в понятный для сайта формат
    function csvToJSON(csv) {
        const lines = csv.split('\n');
        const result = [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Умное разделение строки (учитывает запятые внутри кавычек)
            const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const obj = {};

            headers.forEach((header, s) => {
                let value = currentline[s] ? currentline[s].trim() : "";
                // Убираем лишние кавычки, если они есть
                obj[header] = value.replace(/^"|"$/g, '');
            });
            result.push(obj);
        }
        return result;
    }

    // Загрузка данных
    fetch(SHEET_CSV_URL)
        .then(response => {
            if (!response.ok) throw new Error();
            return response.text();
        })
        .then(csvText => {
            productsData = csvToJSON(csvText);
            renderCatalog(productsData);
        })
        .catch(() => {
            // Вежливое сообщение для клиента в случае сбоя сети
            catalogContainer.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; grid-column: 1/-1;">
                    <h3 style="margin-top:0">Обновляем каталог товаров...</h3>
                    <p>Пожалуйста, уточните наличие и цену у менеджера:</p>
                    <a href="tel:+79818881337" style="color: #222; font-weight: bold; font-size: 24px; text-decoration: none;">+7 (981) 888-13-37</a>
                    <br><br>
                    <a href="https://wa.me/79818881337" style="display: inline-block; padding: 10px 20px; background: #25D366; color: #fff; border-radius: 5px; text-decoration: none; font-weight: bold;">Написать в WhatsApp</a>
                </div>
            `;
        });

    function renderCatalog(items) {
        catalogContainer.innerHTML = '';
        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center; font-size: 1.2rem; background: rgba(0,0,0,0.5); padding: 20px;">По вашему запросу ничего не найдено. Попробуйте ввести артикул или название детали.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            
            // Формируем ссылку для WhatsApp
            const waMessage = encodeURIComponent(`Здравствуйте! Меня интересует запчасть: ${product.name} (Арт: ${product.sku}). Есть в наличии?`);
            const waLink = `https://wa.me/79818881337?text=${waMessage}`;
            
            const imgPath = product.image ? `images/parts/${product.image}` : 'https://placehold.co/400x300?text=Komatsu';
            const displayPrice = product.price ? Number(product.price).toLocaleString() + ' ₽' : 'По запросу';

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imgPath}" class="product-img" onerror="this.src='https://placehold.co/400x300?text=РАССВЕТ-С'">
                </div>
                <div class="product-sku">Арт: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${displayPrice}</div>
                <div style="display: flex; gap: 10px;">
                    <a href="tel:+79818881337" class="btn-order" style="flex: 1; padding: 10px; font-size: 12px; background: #222;">📞 Позвонить</a>
                    <a href="${waLink}" target="_blank" class="btn-order" style="flex: 1; padding: 10px; font-size: 12px; background: #25D366; color: white;">💬 WhatsApp</a>
                </div>
            `;
            catalogContainer.appendChild(card);
        });
    }

    // Поиск по названию и артикулу
    searchInput.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        const filtered = productsData.filter(p => 
            (p.name && p.name.toLowerCase().includes(text)) || 
            (p.sku && p.sku.toLowerCase().includes(text))
        );
        renderCatalog(filtered);
    });
});