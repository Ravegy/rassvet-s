let cart=JSON.parse(localStorage.getItem('rassvet_cart'))||[],favorites=JSON.parse(localStorage.getItem('rassvet_fav'))||[],currentLightboxImages=[],currentLightboxIndex=0;

function getImageUrl(p){if(!p||!p.trim())return SITE_CONFIG.placeholderImage;if(p.startsWith('http'))return p;return 'images/parts/'+p.trim().replace(/^images\/parts\//,'').replace(/^parts\//,'').replace(/^\//,'')}
function formatPrice(p){if(!p)return'По запросу';const c=parseFloat(p.replace(/\s/g,'').replace(',','.'));return isNaN(c)?p:new Intl.NumberFormat('ru-RU').format(c)+' ₽'}
function parsePrice(s){if(!s)return 0;return parseFloat(s.replace(/\s/g,'').replace('₽','').replace(',','.'))||0}

// НОВАЯ ФУНКЦИЯ: Копирование в буфер обмена
window.copyToClipboard=function(text){
    if(navigator.clipboard){
        navigator.clipboard.writeText(text).then(()=>{window.showNotification('Артикул скопирован: '+text);});
    } else {
        const ta=document.createElement('textarea');
        ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        window.showNotification('Артикул скопирован');
    }
};

function createCardHtml(p){
    const i=getImageUrl(p.images[0]),pr=formatPrice(p.price),n=p.name.replace(/'/g,""),aj=JSON.stringify(p.images.map(x=>getImageUrl(x))).replace(/"/g,"&quot;");
    const isF=favorites.includes(p.id)?'active':'';
    // ОБНОВЛЕНО: Добавлен класс copy-sku и onclick для копирования артикула
    return `<div class="img-wrapper" onclick="openLightbox(${aj},0)"><button class="card-fav-btn ${isF}" onclick="toggleFav('${p.id}',event)" data-fav-id="${p.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button><img src="${i}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='${SITE_CONFIG.placeholderImage}'"></div><div class="product-sku copy-sku" onclick="copyToClipboard('${p.sku}')" title="Копировать артикул">АРТ: ${p.sku}</div><a href="product.html?id=${p.id}" class="product-title">${p.name}</a><div class="product-price">${pr}</div><div class="btn-group"><a href="product.html?id=${p.id}" class="btn-card btn-blue">Подробнее</a><button id="btn-add-${p.id}" onclick="addToCart('${p.id}','${p.sku}','${n}','${pr}')" class="btn-card btn-green">В КОРЗИНУ</button><div id="btn-qty-${p.id}" class="btn-qty-grid hidden"><button onclick="updateItemQty('${p.id}',-1)">-</button><span id="qty-val-${p.id}">1</span><button onclick="updateItemQty('${p.id}',1)">+</button></div></div>`;
}

function renderLayout(){
    if(typeof SITE_CONFIG==='undefined'){console.error('Config missing');return;}
    const path=window.location.pathname,isActive=p=>(p==='index.html'&&(path.endsWith('/')||path.includes('index.html')))?'active':(path.includes(p)?'active':'');
    const c=SITE_CONFIG.contacts,showIf=l=>l?'flex':'none';
    const h=document.querySelector('header');
    
    // ХЕДЕР (Без изменений)
    if(h){h.className='header';h.innerHTML=`<div class="container header-main"><button class="menu-btn" id="menuBtn"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button><a href="index.html" class="logo-text"><h1>РАССВЕТ-С</h1></a><nav class="header-nav" id="headerNav"><a href="index.html" class="nav-link ${isActive('index.html')}">Каталог</a><a href="about.html" class="nav-link ${isActive('about.html')}">О компании</a><a href="delivery.html" class="nav-link ${isActive('delivery.html')}">Доставка и оплата</a><a href="contacts.html" class="nav-link ${isActive('contacts.html')}">Контакты</a></nav><div class="header-contacts"><div class="header-icon-btn" id="favBtn"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span class="icon-count" id="favCount">0</span></div><div class="header-icon-btn" id="cartBtn"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span class="icon-count" id="cartCount">0</span></div></div></div>`;}
    
    // МОДАЛКИ И ВИДЖЕТЫ
    if(!document.getElementById('cartModal')){
        const d=document.createElement('div');
        d.innerHTML=`
        <div id="cartModal" class="cart-modal"><div class="cart-content"><div class="cart-header"><h2>Ваша корзина</h2><span class="close-cart" id="closeCart">&times;</span></div><div class="cart-items" id="cartItems"></div><div class="cart-footer"><span id="cartTotal" class="cart-total">Итого: 0 ₽</span><button id="cartOrderBtn" class="btn-cart-order">Отправить запрос</button></div></div></div>
        <div id="favModal" class="cart-modal"><div class="cart-content"><div class="cart-header"><h2>Избранное</h2><span class="close-cart" id="closeFav">&times;</span></div><div class="cart-items" id="favItems"></div></div></div>
        <div id="orderModal" class="cart-modal" style="z-index: 2100;"><div class="cart-content"><div class="cart-header"><h2>Оформление заказа</h2><span class="close-cart" id="closeOrder">&times;</span></div><form id="orderForm" class="order-form"><div class="form-group"><input type="text" id="orderName" class="form-input" placeholder="Ваше Имя" required></div><div class="form-group"><input type="tel" id="orderPhone" class="form-input" placeholder="Номер телефона" required></div><div class="form-group"><input type="email" id="orderEmail" class="form-input" placeholder="Email (необязательно)"></div><button type="submit" class="btn-cart-order">Подтвердить заказ</button></form></div></div>
        
        <div id="notFoundModal" class="cart-modal" style="z-index: 2200;"><div class="cart-content"><div class="cart-header"><h2>Запрос детали</h2><span class="close-cart" onclick="document.getElementById('notFoundModal').style.display='none'">&times;</span></div><form id="notFoundForm" class="order-form"><div class="form-group"><input type="text" id="nfName" class="form-input" placeholder="Ваше Имя" required></div><div class="form-group"><input type="tel" id="nfPhone" class="form-input" placeholder="Номер телефона" required></div><div class="form-group"><textarea id="nfDesc" class="form-input" placeholder="Какую деталь ищете? (Артикул, модель техники)" rows="4" required></textarea></div><button type="submit" class="btn-cart-order">Найти деталь</button></form></div></div>

        <div id="lightbox" class="lightbox" onclick="closeLightbox(event)"><button class="lightbox-nav lightbox-prev" onclick="navigateLightbox(event,-1)">&#10094;</button><span class="lightbox-close" onclick="closeLightbox(event)">&times;</span><img class="lightbox-content" id="lightboxImg" onerror="this.src='${SITE_CONFIG.placeholderImage}'"><button class="lightbox-nav lightbox-next" onclick="navigateLightbox(event,1)">&#10095;</button></div>
        <div id="toast-container"></div>
        
        <div class="floating-widget">
            <div class="widget-toggle" onclick="this.classList.toggle('active');document.querySelector('.widget-menu').classList.toggle('active')">
                <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
            <div class="widget-menu">
                <a href="${c.whatsapp}" target="_blank" class="widget-btn wa" title="WhatsApp"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></a>
                <a href="${c.telegram}" target="_blank" class="widget-btn tg" title="Telegram"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.61-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.8-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>
                <a href="tel:${c.phoneLink}" class="widget-btn ph" title="Позвонить"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></a>
            </div>
        </div>`;
        document.body.appendChild(d);
    }

    const f=document.querySelector('footer');
    if(f){f.className='footer';f.innerHTML=`<div class="container"><div class="footer-content"><div class="footer-col"><h4>О компании</h4><p>ООО «РАССВЕТ-С» — надежный поставщик запчастей и комплектующих для лесозаготовительной техники Komatsu.</p><div class="footer-socials"><a href="${c.telegram}" target="_blank" class="social-btn telegram" style="display:${showIf(c.telegram)}" aria-label="Telegram"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.61-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a><a href="${c.whatsapp}" target="_blank" class="social-btn whatsapp" style="display:${showIf(c.whatsapp)}" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></a><a href="${c.vk}" target="_blank" class="social-btn vk" style="display:${showIf(c.vk)}" aria-label="VK"><svg viewBox="0 0 24 24"><path d="M13.162 18.994c.609 0 .858-.406.851-1.512-.006-1.72.784-2.527 1.522-2.527.676 0 1.568.658 1.948 2.378.109.493.502.593.74.593h2.324c.787 0 1.101-.392 1.135-.857.073-1.021-.924-2.527-2.384-3.527-.608-.415-.589-.728.061-1.391.821-.837 2.18-2.618 2.364-3.593.033-.175.039-.481-.225-.481h-2.338c-.732 0-.989.336-1.229.832-1.006 2.072-2.41 3.251-3.216 3.251-.274 0-.463-.158-.463-.889V8.407c0-1.211-.284-1.407-1.022-1.407h-2.18c-.378 0-.698.192-.698.593 0 .428.632.535.698 1.76v3.131c0 .693-.214.97-.681.97-.97 0-3.329-3.593-4.329-7.234-.163-.585-.438-.813-1.022-.813H2.887c-.773 0-.937.336-.937.679 0 .684.974 4.116 4.382 8.781C8.627 17.5 11.237 18.994 13.162 18.994z"/></svg></a><a href="${c.avito}" target="_blank" class="social-btn avito" style="display:${showIf(c.avito)}" aria-label="Avito"><svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/></svg></a></div></div><div class="footer-col"><h4>Навигация</h4><nav class="footer-nav"><a href="index.html">Каталог</a><a href="about.html">О компании</a><a href="delivery.html">Доставка и оплата</a><a href="contacts.html">Контакты</a><a href="policy.html">Политика конфиденциальности</a></nav></div><div class="footer-col"><h4>Контакты</h4><div class="footer-contacts-list"><div class="footer-contact-item"><div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div><div class="footer-contact-info"><span class="footer-contact-label">Телефон</span><a href="tel:${c.phoneLink}" class="footer-phone-big">${c.phoneDisplay}</a></div></div><div class="footer-contact-item"><div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div><div class="footer-contact-info"><span class="footer-contact-label">Email</span><a href="mailto:${c.email}" class="footer-link">${c.email}</a></div></div><div class="footer-contact-item"><div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><div class="footer-contact-info"><span class="footer-contact-label">Адрес склада</span><span style="color: #ccc; line-height: 1.4;">${c.address}</span></div></div></div></div></div><div class="footer-bottom"><p class="footer-disclaimer">Данный сайт носит исключительно информационный характер и ни при каких условиях информационные материалы и цены, размещенные на сайте, не являются публичной офертой, определяемой положениями Статьи 437 Гражданского кодекса РФ.</p></div></div>`;}
}

async function getCatalogData() {
    const k='rassvet_v7_data',t='rassvet_v7_time',m=(SITE_CONFIG.cacheTime||1)*60*60*1000,cd=localStorage.getItem(k),ct=localStorage.getItem(t),n=Date.now();
    if(cd&&ct&&(n-ct<m))return JSON.parse(cd);
    try{
        const r=await fetch(SITE_CONFIG.sheetUrl);if(!r.ok)throw new Error('Err');
        const txt=await r.text(),rows=parseCSV(txt);rows.shift();
        const p=rows.map(r=>{if(!r[0])return null;let i=r[5]?r[5].split(',').map(s=>s.trim()).filter(s=>s):[''];return{id:r[0],sku:r[1]?r[1].trim():'',name:r[2],price:r[3],category:r[4]?r[4].trim():'Другое',images:i,desc:r[6]};}).filter(x=>x!==null&&x.name);
        localStorage.setItem(k,JSON.stringify(p));localStorage.setItem(t,n);return p;
    }catch(e){console.error(e);return[];}
}

function parseCSV(t){
    const r=[];
    let row=[],q=false,c='';
    for(let i=0;i<t.length;i++){
        const ch=t[i];
        if(ch==='"')q=!q;
        else if(ch===','&&!q){row.push(c);c='';}
        else if((ch==='\r'||ch==='\n')&&!q){
            if(c||row.length>0)row.push(c);
            if(row.length>0)r.push(row);
            row=[];
            c='';
            if(ch==='\r'&&t[i+1]==='\n')i++;
        }
        else c+=ch;
    }
    if(c||row.length>0){row.push(c);r.push(row);}
    return r;
}

function debounce(f,w){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>f(...a),w);};}
function validateInput(i,t){const v=i.value.trim();let ok=true,m='';i.classList.remove('error','success');const p=i.parentElement;let e=p.querySelector('.error-message');if(!e){e=document.createElement('div');e.className='error-message';p.appendChild(e);}p.classList.remove('has-error');if(t==='name'){if(v.length<2){ok=false;m='Имя короткое';}}else if(t==='phone'){if(v.length<18){ok=false;m='Номер не полный';}}else if(t==='email'){if(v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ok=false;m='Неверный Email';}}if(!ok){i.classList.add('error');p.classList.add('has-error');e.textContent=m;}else if(v.length>0)i.classList.add('success');return ok;}

window.showNotification=function(m){const c=document.getElementById('toast-container');if(!c)return;const t=document.createElement('div');t.className='toast';t.textContent=m;c.appendChild(t);setTimeout(()=>{t.classList.add('hiding');t.addEventListener('animationend',()=>t.remove());},3000);};
window.openLightbox=function(i,x=0){if(typeof i==='string')currentLightboxImages=[i];else currentLightboxImages=i;currentLightboxIndex=x;updateLightboxContent();const l=document.getElementById('lightbox');if(l){l.classList.add('active');if(currentLightboxImages.length<=1)l.classList.add('single');else l.classList.remove('single');}};
function updateLightboxContent(){const i=document.getElementById('lightboxImg');if(i&&currentLightboxImages.length>0)i.src=currentLightboxImages[currentLightboxIndex];}
window.navigateLightbox=function(e,d){e.stopPropagation();if(currentLightboxImages.length<=1)return;currentLightboxIndex+=d;if(currentLightboxIndex<0)currentLightboxIndex=currentLightboxImages.length-1;else if(currentLightboxIndex>=currentLightboxImages.length)currentLightboxIndex=0;updateLightboxContent();};
window.closeLightbox=function(e){const l=document.getElementById('lightbox');if(l&&(e.target.id==='lightbox'||e.target.classList.contains('lightbox-close'))){l.classList.remove('active');setTimeout(()=>{document.getElementById('lightboxImg').src='';},300);}};

window.updateCartUI=function(){
    const cc=document.getElementById('cartCount'),ci=document.getElementById('cartItems'),ct=document.getElementById('cartTotal'),t=cart.reduce((s,i)=>s+i.quantity,0);
    if(cc){cc.textContent=t; cc.style.display=t>0?'block':'none';}
    if(ci){ci.innerHTML='';let tm=0;cart.forEach((x,i)=>{const p=parsePrice(x.price);tm+=p*x.quantity;const d=document.createElement('div');d.className='cart-item';d.innerHTML=`<div class="cart-item-info"><span class="cart-item-title">${x.sku} - ${x.name}</span><span class="cart-item-price">${x.price}</span></div><div class="qty-controls"><button class="qty-btn" onclick="changeQuantity(${i},-1)">-</button><span class="qty-count">${x.quantity}</span><button class="qty-btn" onclick="changeQuantity(${i},1)">+</button></div><button class="btn-remove" onclick="removeCartItem(${i})">&times;</button>`;ci.appendChild(d);});if(ct)ct.textContent=`Итого: ${new Intl.NumberFormat('ru-RU').format(tm)} ₽`;}
    localStorage.setItem('rassvet_cart',JSON.stringify(cart));
    if(window.syncButtonsWithCart)window.syncButtonsWithCart();
};

window.syncButtonsWithCart=function(){document.querySelectorAll('[data-product-id]').forEach(c=>{const id=c.getAttribute('data-product-id'),x=cart.find(i=>i.id===id),ba=document.getElementById(`btn-add-${id}`),bq=document.getElementById(`btn-qty-${id}`),qv=document.getElementById(`qty-val-${id}`);if(ba&&bq&&qv){if(x){ba.classList.add('hidden');bq.classList.remove('hidden');qv.textContent=x.quantity;}else{ba.classList.remove('hidden');bq.classList.add('hidden');}}});};
window.addToCart=function(id,sku,name,price){const i=cart.find(x=>x.id===id);if(i)i.quantity++;else{cart.push({id,sku,name,price,quantity:1});window.showNotification('Добавлено');}window.updateCartUI();};
window.updateItemQty=function(id,d){const i=cart.find(p=>p.id===id);if(i){i.quantity+=d;if(i.quantity<=0)cart=cart.filter(p=>p.id!==id);window.updateCartUI();}};
window.changeQuantity=function(i,d){const x=cart[i];x.quantity+=d;if(x.quantity<=0)x.quantity=1;window.updateCartUI();};
window.removeCartItem=function(i){cart.splice(i,1);window.updateCartUI();};
window.changeMainImage=function(s,x=0){const m=document.getElementById('productMainImg'),w=document.getElementById('mainImgWrapper');if(m)m.src=s;if(w){let c=w.getAttribute('onclick'),n=c.replace(/,\s*\d+\s*\)$/,`,${x})`);w.setAttribute('onclick',n);}};

window.toggleFav=function(id,e){e?.stopPropagation();const idx=favorites.indexOf(id);if(idx>-1){favorites.splice(idx,1);window.showNotification('Удалено из избранного');}else{favorites.push(id);window.showNotification('Добавлено в избранное');}localStorage.setItem('rassvet_fav',JSON.stringify(favorites));updateFavUI();};
function updateFavUI(){const fc=document.getElementById('favCount');if(fc){fc.textContent=favorites.length; fc.style.display=favorites.length>0?'block':'none';} document.querySelectorAll('.card-fav-btn, .btn-fav-full').forEach(b=>{const id=b.getAttribute('data-fav-id');if(favorites.includes(id))b.classList.add('active');else b.classList.remove('active');});}
async function renderFavorites(){
    const c=document.getElementById('favItems');
    if(!c)return;
    c.innerHTML='<div class="loader-container"><div class="spinner"></div></div>';
    const all=await getCatalogData(),favs=all.filter(p=>favorites.includes(p.id));
    c.innerHTML='';
    if(favs.length===0){c.innerHTML='<div class="fav-empty">Список избранного пуст</div>';return;}
    
    favs.forEach(p=>{
        const d=document.createElement('div');
        d.className='fav-item-grid';
        const pr=formatPrice(p.price),n=p.name.replace(/'/g,"");
        d.innerHTML=`<img src="${getImageUrl(p.images[0])}" class="fav-item-img" style="cursor:pointer" onclick="window.location.href='product.html?id=${p.id}'"><div style="overflow:hidden;cursor:pointer" onclick="window.location.href='product.html?id=${p.id}'"><div style="font-weight:bold;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div><div style="color:#aaa;font-size:12px;">${p.sku}</div><div style="color:var(--accent);font-weight:bold;font-size:13px;">${pr}</div></div><button class="btn-fav-cart" onclick="addToCart('${p.id}','${p.sku}','${n}','${pr}')">В КОРЗИНУ</button><button class="btn-remove" onclick="toggleFav('${p.id}');renderFavorites();">&times;</button>`;
        c.appendChild(d);
    });
}

document.addEventListener('DOMContentLoaded',()=>{
    if(typeof SITE_CONFIG==='undefined')return;
    renderLayout();window.updateCartUI();updateFavUI();
    const mb=document.getElementById('menuBtn'),hn=document.getElementById('headerNav');
    if(mb&&hn){mb.addEventListener('click',e=>{e.stopPropagation();hn.classList.toggle('active');mb.innerHTML=hn.classList.contains('active')?'<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>':'<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';});document.addEventListener('click',e=>{if(!hn.contains(e.target)&&!mb.contains(e.target)&&hn.classList.contains('active')){hn.classList.remove('active');mb.innerHTML='<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';}});}
    
    const cm=document.getElementById('cartModal'),cw=document.getElementById('cartBtn'),cc=document.getElementById('closeCart'),cob=document.getElementById('cartOrderBtn'),om=document.getElementById('orderModal'),co=document.getElementById('closeOrder');
    const fm=document.getElementById('favModal'),fw=document.getElementById('favBtn'),fc=document.getElementById('closeFav');
    
    if(cw)cw.onclick=()=>{cm.style.display='flex';window.updateCartUI();};
    if(cc)cc.onclick=()=>{cm.style.display='none';};if(co)co.onclick=()=>{om.style.display='none';};if(cob)cob.onclick=()=>{if(cart.length===0){window.showNotification('Пустая корзина');return;}cm.style.display='none';om.style.display='flex';};
    if(fw)fw.onclick=()=>{fm.style.display='flex';renderFavorites();};if(fc)fc.onclick=()=>{fm.style.display='none';};
    window.onclick=e=>{if(e.target==cm)cm.style.display='none';if(e.target==om)om.style.display='none';if(e.target==fm)fm.style.display='none';};
    
    const of=document.getElementById('orderForm');
    if(of){const op=document.getElementById('orderPhone'),on=document.getElementById('orderName'),oe=document.getElementById('orderEmail');if(op&&window.IMask)IMask(op,{mask:'+{7} (000) 000-00-00'});if(on)on.addEventListener('input',()=>validateInput(on,'name'));if(op)op.addEventListener('input',()=>validateInput(op,'phone'));if(oe)oe.addEventListener('input',()=>validateInput(oe,'email'));of.onsubmit=e=>{e.preventDefault();if(!validateInput(on,'name')||!validateInput(op,'phone')||!validateInput(oe,'email'))return;let m=`<b>Новый заказ!</b>\n<b>Имя:</b> ${on.value}\n<b>Тел:</b> ${op.value}\n`;if(oe.value)m+=`<b>Email:</b> ${oe.value}\n`;m+=`\n<b>Заказ:</b>\n`;let tm=0;cart.forEach(i=>{tm+=parsePrice(i.price)*i.quantity;m+=`- ${i.sku} ${i.name} (x${i.quantity})\n`;});m+=`\n<b>Сумма: ${new Intl.NumberFormat('ru-RU').format(tm)} ₽</b>`;sendOrderToTelegram(m,of);};}
    
    // ОБНОВЛЕНО: Обработчик формы "Не нашли"
    const nff=document.getElementById('notFoundForm');
    if(nff){
        const nfName=document.getElementById('nfName'), nfPhone=document.getElementById('nfPhone');
        if(window.IMask)IMask(nfPhone,{mask:'+{7} (000) 000-00-00'});
        nff.onsubmit=e=>{
            e.preventDefault();
            const desc=document.getElementById('nfDesc').value;
            sendOrderToTelegram(`<b>🔍 ЗАПРОС ДЕТАЛИ!</b>\n\n<b>Имя:</b> ${nfName.value}\n<b>Тел:</b> ${nfPhone.value}\n<b>Ищет:</b> ${desc}`, nff);
            document.getElementById('notFoundModal').style.display='none';
        };
    }

    const cg=document.getElementById('catalog');
    if(cg){
        let all=[],cnt=0,cat='all';
        const lmb=document.getElementById('loadMoreBtn'),lmc=document.getElementById('loadMoreContainer'),si=document.getElementById('searchInput'),cf=document.getElementById('categoryFilter'),ss=document.getElementById('sortSelect');
        
        async function init(){
            try {
                all=await getCatalogData();
                if(all.length===0){cg.innerHTML='<div class="loader-container"><p class="error-text">Нет данных</p></div>';return;}
                initCats(all);
                batch(true);
                if(ss)ss.addEventListener('change',()=>{const v=ss.value;if(v==='default')all.sort((a,b)=>a.id-b.id);else if(v==='price_asc')all.sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));else if(v==='price_desc')all.sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));else if(v==='name_asc')all.sort((a,b)=>a.name.localeCompare(b.name));batch(true);});
            } catch(e){console.error(e);cg.innerHTML='<div class="loader-container"><p class="error-text">Ошибка сети</p></div>';}
        }

        function initCats(p){if(!cf)return;const c=['Все',...new Set(p.map(x=>x.category).filter(x=>x))];cf.innerHTML='';c.forEach(x=>{const b=document.createElement('button');b.className=x==='Все'?'cat-btn active':'cat-btn';b.textContent=x;b.onclick=()=>{document.querySelectorAll('.cat-btn').forEach(z=>z.classList.remove('active'));b.classList.add('active');cat=x==='Все'?'all':x;batch(true);};cf.appendChild(b);});}
        
        // ОБНОВЛЕННАЯ ФУНКЦИЯ BATCH (ПОИСК ПО VIN + БЛОК НЕ НАШЛИ)
        function batch(r=false){
            if(r){cg.innerHTML='';cnt=0;lmc.style.display='none';}
            const s=si?si.value.toLowerCase():'';
            // ПОИСК: ТЕПЕРЬ ИЩЕМ И В ОПИСАНИИ (p.desc) ДЛЯ VIN И МОДЕЛЕЙ
            const f=all.filter(p=>(cat==='all'||p.category===cat)&&(!s||p.name.toLowerCase().includes(s)||p.sku.toLowerCase().includes(s)||(p.desc&&p.desc.toLowerCase().includes(s))));
            
            if(f.length===0){
                // ПОКАЗЫВАЕМ БЛОК "НЕ НАШЛИ", ЕСЛИ ПУСТО
                cg.innerHTML=`
                    <div style="grid-column:1/-1;text-align:center;padding:40px;color:#ccc;">Ничего не найдено по запросу "${si.value}"</div>
                    <div class="not-found-block">
                        <h3 class="not-found-title">Не нашли нужную запчасть?</h3>
                        <p class="not-found-text">Оставьте заявку, мы проверим наличие и свяжемся с вами.</p>
                        <button class="btn-load-more" onclick="document.getElementById('notFoundModal').style.display='flex'">Оставить запрос</button>
                    </div>`;
                return;
            }
            
            const n=f.slice(cnt,cnt+SITE_CONFIG.itemsPerPage);
            n.forEach(p=>{const d=document.createElement('div');d.className='product-card';d.setAttribute('data-product-id',p.id);d.innerHTML=createCardHtml(p);cg.appendChild(d);});
            
            // ЕСЛИ ДОЛИСТАЛИ ДО КОНЦА, ДОБАВЛЯЕМ БЛОК "НЕ НАШЛИ" ВНИЗ
            if(cnt+n.length >= f.length && f.length > 0) {
                 const nf=document.createElement('div');
                 nf.className='not-found-block';
                 nf.innerHTML=`<h3 class="not-found-title">Не нашли нужную запчасть?</h3><p class="not-found-text">Оставьте заявку, мы проверим наличие и свяжемся с вами.</p><button class="btn-load-more" onclick="document.getElementById('notFoundModal').style.display='flex'">Оставить запрос</button>`;
                 cg.appendChild(nf);
            }

            cnt+=n.length;
            if(lmc)lmc.style.display=(cnt<f.length)?'block':'none';
            window.updateCartUI();updateFavUI();
        }

        if(lmb)lmb.addEventListener('click',()=>batch());if(si)si.addEventListener('input',debounce(()=>batch(true),300));init();
    }

    const pd=document.getElementById('productDetail');
    if(pd){
        const id=new URLSearchParams(window.location.search).get('id');
        if(!id){pd.innerHTML='<h2 style="text-align:center;color:#fff;">Товар не найден</h2>';return;}
        (async function(){try{const all=await getCatalogData(),p=all.find(x=>x.id===id);if(p){renderProd(p);renderRel(all,p);document.title=`${p.name} | РАССВЕТ-С`;}else pd.innerHTML=`<h2 style="text-align:center;color:#fff;">Товар ${id} не найден</h2>`;}catch(e){console.error(e);pd.innerHTML='<h2 style="text-align:center;color:#fff;">Ошибка</h2>';}})();
        
        // ОБНОВЛЕННАЯ ФУНКЦИЯ RENDER PROD (SEO + BREADCRUMBS + COPY + ИСПРАВЛЕННАЯ ВЕРСТКА)
        function renderProd(p){
            const m=getImageUrl(p.images[0]),pr=formatPrice(p.price),n=p.name.replace(/'/g,""),aj=JSON.stringify(p.images.map(x=>getImageUrl(x))).replace(/"/g,"&quot;");let th='';if(p.images.length>1){th='<div class="gallery-thumbs">';p.images.forEach((x,i)=>{const u=getImageUrl(x);th+=`<div class="gallery-thumb" onclick="changeMainImage('${u}',${i})"><img src="${u}"></div>`;});th+='</div>';}
            const isF=favorites.includes(p.id)?'active':'';
            
            // SEO SCHEMA (JSON-LD)
            const schemaData = {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": p.name,
                "image": p.images.map(x=>getImageUrl(x)),
                "description": p.desc || `Запчасть ${p.name} для спецтехники Komatsu`,
                "sku": p.sku,
                "offers": {
                    "@type": "Offer",
                    "url": window.location.href,
                    "priceCurrency": "RUB",
                    "price": parsePrice(p.price),
                    "availability": "https://schema.org/InStock"
                }
            };
            const sc = document.createElement('script');
            sc.type = "application/ld+json";
            sc.text = JSON.stringify(schemaData);
            document.head.appendChild(sc);

            // BREADCRUMBS (Стрелочки > вместо слэшей)
            const bread = `
            <div class="breadcrumbs">
                <a href="index.html">Главная</a> <span class="sep">❯</span> 
                <a href="index.html">Каталог</a> <span class="sep">❯</span> 
                <span class="current">${p.sku}</span>
            </div>`;

            // RENDER (Новая структура: Крошки сверху, затем product-card-body с контентом)
            pd.innerHTML=`
            <div class="product-full-card" data-product-id="${p.id}">
                ${bread}
                <div class="product-card-body">
                    <div class="gallery-container" style="flex:1;min-width:300px;">
                        <div class="full-img-wrapper" id="mainImgWrapper" onclick="openLightbox(${aj},0)">
                            <img id="productMainImg" src="${m}" alt="${p.name}" onerror="this.src='${SITE_CONFIG.placeholderImage}'">
                        </div>
                        ${th}
                    </div>
                    <div class="full-info">
                        <div class="full-sku copy-sku" onclick="copyToClipboard('${p.sku}')" title="Копировать" style="display:inline-block; width:auto;">АРТИКУЛ: ${p.sku}</div>
                        <h1 class="full-title">${p.name}</h1>
                        <div class="full-price">${pr}</div>
                        <div class="full-actions-group">
                            <a href="index.html" class="btn-detail blue">В КАТАЛОГ</a>
                            <button id="btn-add-${p.id}" onclick="addToCart('${p.id}','${p.sku}','${n}','${pr}')" class="btn-detail green">В КОРЗИНУ</button>
                            <button class="btn-fav-full ${isF}" onclick="toggleFav('${p.id}',event)" data-fav-id="${p.id}">
                                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </button>
                            <div id="btn-qty-${p.id}" class="btn-qty-grid hidden">
                                <button onclick="updateItemQty('${p.id}',-1)">-</button>
                                <span id="qty-val-${p.id}">1</span>
                                <button onclick="updateItemQty('${p.id}',1)">+</button>
                            </div>
                        </div>
                        <div class="full-desc">
                            <strong>Описание:</strong><br>${p.desc||'Нет описания'}<br><br>
                            <strong>Категория:</strong> ${p.category||'-'}
                        </div>
                    </div>
                </div>
            </div>`;
            window.updateCartUI();updateFavUI();
        }

        function renderRel(all,curr){
            const rc=document.getElementById('relatedProducts'),cw=document.getElementById('relatedContainer');
            if(!rc||!cw)return;
            const rel=all.filter(x=>x.category===curr.category&&x.id!==curr.id).slice(0,5);
            if(rel.length===0){cw.style.display='none';return;}
            cw.style.display='block';rc.innerHTML='';
            rel.forEach(p=>{const d=document.createElement('div');d.className='product-card';d.setAttribute('data-product-id',p.id);d.innerHTML=createCardHtml(p);rc.appendChild(d);});
            if(window.syncButtonsWithCart)window.syncButtonsWithCart();updateFavUI();
        }
    }

    const cpf=document.getElementById('contactPageForm');
    if(cpf){
        const cn=document.getElementById('contactName'),cp=document.getElementById('contactPhone');
        if(window.IMask)IMask(cp,{mask:'+{7} (000) 000-00-00'});
        cn.addEventListener('input',()=>validateInput(cn,'name'));cp.addEventListener('input',()=>validateInput(cp,'phone'));
        cpf.onsubmit=e=>{e.preventDefault();if(!validateInput(cn,'name')||!validateInput(cp,'phone'))return;const msg=document.getElementById('contactMessage').value,file=document.getElementById('contactFile').files[0];sendContactToTelegram(`<b>📩 Контакт!</b>\n\n<b>Имя:</b> ${cn.value}\n<b>Тел:</b> ${cp.value}\n<b>Сообщение:</b>\n${msg}`,file,cpf);};
    }
});

function sendOrderToTelegram(t,f){const u=`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendMessage`,b=f.querySelector('button'),ot=b.textContent;b.textContent='...';b.disabled=true;fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:SITE_CONFIG.tgChatId,text:t,parse_mode:'HTML'})}).then(r=>{if(r.ok){cart=[];localStorage.setItem('rassvet_cart',JSON.stringify(cart));window.updateCartUI();f.reset();document.getElementById('orderModal').style.display='none';window.showNotification("Успешно!");}else alert("Ошибка");}).catch(()=>alert("Сеть")).finally(()=>{b.textContent=ot;b.disabled=false;});}
function sendContactToTelegram(t,file,f){const b=f.querySelector('button'),ot=b.textContent;b.textContent='...';b.disabled=true;if(file){const fd=new FormData();fd.append('chat_id',SITE_CONFIG.tgChatId);fd.append('caption',t);fd.append('parse_mode','HTML');fd.append('document',file);fetch(`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendDocument`,{method:'POST',body:fd}).then(h).catch(e).finally(()=>{b.textContent=ot;b.disabled=false;});}else{fetch(`https://api.telegram.org/bot${SITE_CONFIG.tgBotToken}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:SITE_CONFIG.tgChatId,text:t,parse_mode:'HTML'})}).then(h).catch(e).finally(()=>{b.textContent=ot;b.disabled=false;});}function h(r){if(r.ok){window.showNotification("Отправлено!");f.reset();document.querySelectorAll('.success').forEach(el=>el.classList.remove('success'));}else window.showNotification("Ошибка");}function e(){window.showNotification("Сеть");}}