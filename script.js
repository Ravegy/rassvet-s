document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // Применяем настройки из config.js в шапку
    document.title = `Запчасти Komatsu | ${SITE_CONFIG.companyName}`;
    document.getElementById('headerPhone').textContent = SITE_CONFIG.displayPhone;
    document.getElementById('headerPhone').href = `tel:${SITE_CONFIG.phone}`;

    // 1. Загрузка из локального кэша (мгновенный старт)
    const cachedData = localStorage.getItem('rassvet_catalog_cache');
    if (cachedData) {
        try {
            productsData = JSON.parse(cachedData);
            renderCatalog(productsData);
        } catch (e) { console.error('Ошибка кэша'); }
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

    // 3. Загрузка из Google Таблиц
    fetch(SITE_CONFIG.sheetUrl)
        .then(response => {
            if (!response.ok) throw new Error();
            return response.text();
        })
        .then(csvText => {
            const freshData = csvToJSON(csvText);
            if (JSON.stringify(freshData) !== JSON.stringify(productsData)) {
                productsData = freshData;
                localStorage.setItem('rassvet_catalog_cache', JSON.stringify(productsData));
                renderCatalog(productsData);
            }
        })
        .catch(() => {
            if (productsData.length === 0) {
                catalogContainer.innerHTML = `<div style="background:white;padding:20px;grid-column:1/-1;text-align:center;border-radius:10px;">
                    <h3>Свяжитесь с нами для уточнения наличия:</h3>
                    <a href="tel:${SITE_CONFIG.phone}" style="font-size:24px;color:#222;text-decoration:none;font-weight:bold;">${SITE_CONFIG.displayPhone}</a>
                </div>`;
            }
        });

    // 4. Отрисовка каталога
    function renderCatalog(items) {
        catalogContainer.innerHTML = '';
        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="color:white;grid-column:1/-1;text-align:center;">Запчасти не найдены.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            
            const imgValue = product.image ? product.image.trim() : '';
            const imgPath = imgValue !== '' ? `images/parts/${imgValue}` : SITE_CONFIG.placeholderImage;

            const waMessage = encodeURIComponent(`${SITE_CONFIG.waDefaultMessage}${product.name} (Арт: ${product.sku}). Есть в наличии?`);
            const waLink = `https://wa.me/${SITE_CONFIG.phone}?text=${waMessage}`;
            
            const priceNum = parseFloat(product.price);
            const displayPrice = !isNaN(priceNum) ? priceNum.toLocaleString() + ' ₽' : 'По запросу';

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imgPath}" class="product-img" onerror="this.src='${SITE_CONFIG.placeholderImage}'">
                </div>
                <div class="product-sku">Арт: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${displayPrice}</div>
                <div style="display: flex; gap: 8px;">
                    <a href="tel:${SITE_CONFIG.phone}" class="btn-order" style="flex:1;background:#222;padding:10px;font-size:11px;">📞 Позвонить</a>
                    <a href="${waLink}" target="_blank" class="btn-order" style="flex:1;background:#25D366;padding:10px;font-size:11px;">💬 WhatsApp</a>
                </div>
            `;
            catalogContainer.appendChild(card);
        });
    }

    // 5. Поиск
    searchInput.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        const filtered = productsData.filter(p => 
            (p.name && p.name.toLowerCase().includes(text)) || 
            (p.sku && p.sku.toLowerCase().includes(text))
        );
        renderCatalog(filtered);
    });
});