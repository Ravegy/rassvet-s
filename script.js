document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // Применяем базовые настройки
    document.title = `Запчасти Komatsu | ${SITE_CONFIG.companyName}`;
    document.getElementById('headerPhone').textContent = SITE_CONFIG.displayPhone;
    document.getElementById('headerPhone').href = `tel:${SITE_CONFIG.phone}`;

    const cachedData = localStorage.getItem('rassvet_catalog_cache');
    if (cachedData) {
        try {
            productsData = JSON.parse(cachedData);
            renderCatalog(productsData);
        } catch (e) { console.error('Ошибка кэша'); }
    }

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
                catalogContainer.innerHTML = `<div style="background:white;padding:40px;grid-column:1/-1;text-align:center;border:1px solid #eee;">
                    <h3>База данных временно обновляется</h3>
                    <p>Пожалуйста, позвоните нам для заказа:</p>
                    <a href="tel:${SITE_CONFIG.phone}" style="font-size:24px;color:${SITE_CONFIG.colors.primary};text-decoration:none;font-weight:bold;">${SITE_CONFIG.displayPhone}</a>
                </div>`;
            }
        });

    function renderCatalog(items) {
        catalogContainer.innerHTML = '';
        if (items.length === 0) {
            catalogContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:50px;color:#999;">Товары не найдены. Попробуйте другой запрос.</p>';
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
                <div class="product-sku">АРТИКУЛ: ${product.sku}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${displayPrice}</div>
                <div class="btn-group">
                    <a href="tel:${SITE_CONFIG.phone}" class="btn-order btn-call">📞 Позвонить</a>
                    <a href="${waLink}" target="_blank" class="btn-order btn-wa">💬 WhatsApp</a>
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