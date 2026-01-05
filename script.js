document.addEventListener('DOMContentLoaded', () => {
    const catalog = document.getElementById('catalog');
    const search = document.getElementById('searchInput');

    document.getElementById('cfgLogoName').innerText = SITE_CONFIG.companyName;
    document.getElementById('footerName').innerText = SITE_CONFIG.companyName;
    document.getElementById('cfgAddress').innerText = SITE_CONFIG.address;
    document.getElementById('cfgWorkTime').innerText = SITE_CONFIG.workTime;
    document.getElementById('headerPhone').innerText = SITE_CONFIG.displayPhone;
    document.getElementById('headerPhone').href = `tel:${SITE_CONFIG.phone}`;
    document.getElementById('footerPhone').innerText = `📞 ${SITE_CONFIG.displayPhone}`;
    document.getElementById('footerEmail').innerText = `✉️ ${SITE_CONFIG.email}`;
    document.getElementById('footerAddr').innerText = SITE_CONFIG.address;
    document.getElementById('topWaLink').href = `https://wa.me/${SITE_CONFIG.phone}`;

    let data = JSON.parse(localStorage.getItem('rassvet_db') || '[]');
    render(data);

    fetch(SITE_CONFIG.sheetUrl)
        .then(res => res.text())
        .then(csv => {
            const lines = csv.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const json = lines.slice(1).map(line => {
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const obj = {};
                headers.forEach((h, i) => obj[h] = (cols[i] || "").trim().replace(/^"|"$/g, ''));
                return obj;
            });
            data = json;
            localStorage.setItem('rassvet_db', JSON.stringify(json));
            render(json);
        });

    function render(items) {
        catalog.innerHTML = items.map(p => {
            const img = p.image ? `images/parts/${p.image}` : SITE_CONFIG.placeholderImage;
            const wa = `https://wa.me/${SITE_CONFIG.phone}?text=${encodeURIComponent(SITE_CONFIG.waDefaultMessage + p.name + ' Арт: ' + p.sku)}`;
            const price = p.price ? Number(p.price).toLocaleString() + ' ₽' : 'По запросу';
            return `
                <div class="product-card">
                    <div class="img-wrapper"><img src="${img}" class="product-img" onerror="this.src='${SITE_CONFIG.placeholderImage}'"></div>
                    <div class="product-sku">АРТИКУЛ: ${p.sku}</div>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price">${price}</div>
                    <div class="btn-group">
                        <a href="tel:${SITE_CONFIG.phone}" class="btn-card btn-blue">Позвонить</a>
                        <a href="${wa}" target="_blank" class="btn-card btn-green">WhatsApp</a>
                    </div>
                </div>`;
        }).join('') || '<p style="grid-column:1/-1;text-align:center;padding:40px;">Загрузка товаров...</p>';
    }

    search.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        render(data.filter(p => p.name.toLowerCase().includes(val) || p.sku.toLowerCase().includes(val)));
    };
});