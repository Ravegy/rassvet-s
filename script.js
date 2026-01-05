document.addEventListener('DOMContentLoaded', () => {
    const catalogContainer = document.getElementById('catalog');
    const searchInput = document.getElementById('searchInput');
    let productsData = [];

    // Применяем настройки из config.js
    document.getElementById('cfgLogoName').textContent = SITE_CONFIG.companyName;
    document.getElementById('footerName').textContent = SITE_CONFIG.companyName;
    document.getElementById('cfgAddress').textContent = SITE_CONFIG.address;
    document.getElementById('footerAddressDisplay').textContent = SITE_CONFIG.address;
    document.getElementById('cfgWorkTime').textContent = SITE_CONFIG.workTime;
    document.getElementById('headerPhone').textContent = SITE_CONFIG.displayPhone;
    document.getElementById('headerPhone').href = `tel:${SITE_CONFIG.phone}`;
    document.getElementById('footerPhoneDisplay').textContent = `📞 ${SITE_CONFIG.displayPhone}`;
    document.getElementById('topWaLink').href = `https://wa.me/${SITE_CONFIG.phone}`;

    // 1. Загрузка из кэша
    const cached = localStorage.getItem('rassvet_cache');
    if (cached) {
        productsData = JSON.parse(cached);
        renderCatalog(productsData);
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
                let val = currentline[s] ? currentline[s].trim() : "";
                obj[header] = val.replace(/^"|"$/g, '');
            });
            result.push(obj);
        }
        return result;
    }

    // 3. Загрузка из Google
    fetch(SITE_CONFIG.sheetUrl)
        .then(res => res.text())
        .then(csv => {
            const freshData = csvToJSON(csv);
            if (JSON.stringify(freshData) !== JSON.stringify(productsData)) {
                productsData = freshData;
                localStorage.setItem('rassvet_cache', JSON.stringify(productsData));
                renderCatalog(productsData);
            }
        })
        .catch(() => {
            if (!productsData.length) {
                catalogContainer.innerHTML = '<div style="background:#fff;padding:40px;grid-column:1/-1;text-align:center;"><h3>Каталог обновляется...</h3><p>Звоните нам: ' + SITE_CONFIG.displayPhone + '</p></div>';
            }
        });

    function renderCatalog(items) {
        catalogContainer.innerHTML = '';
        if (!items.length) {
            catalogContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:50px;color:#999;">Товары не найдены.</p>';
            return;
        }
        items.forEach(p => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            const img = p.image ? `images/parts/${p.image}` : SITE_CONFIG.placeholderImage;
            const waLink = `https://wa.me/${SITE_CONFIG.phone}?text=${encodeURIComponent(SITE_CONFIG.waDefaultMessage + p.name + ' (Арт: ' + p.sku + ')')}`;
            const price = p.price ? Number(p.price).toLocaleString() + ' ₽' : 'По запросу';

            card.innerHTML = `
                <div class="img-wrapper"><img src="${img}" class="product-img" onerror="this.src='${SITE_CONFIG.placeholderImage}'"></div>
                <div class="product-sku">OEM: ${p.sku}</div>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">${price}</div>
                <div class="btn-group">
                    <a href="tel:${SITE_CONFIG.phone}" class="btn-order btn-call">Позвонить</a>
                    <a href="${waLink}" target="_blank" class="btn-order btn-wa">WhatsApp</a>
                </div>`;
            catalogContainer.appendChild(card);
        });
    }

    searchInput.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        const filtered = productsData.filter(p => (p.name && p.name.toLowerCase().includes(text)) || (p.sku && p.sku.toLowerCase().includes(text)));
        renderCatalog(filtered);
    });
});