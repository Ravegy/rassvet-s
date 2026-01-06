const SITE_CONFIG = {
    // Ссылка на опубликованную CSV таблицу
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSWW1kw6De7LtGdpg_wFUyJBWeapw_WtiaRZmmwreIFphLg6W_xv-ThZJL6_OmxIUN0U8sNGSiPpAa3/pub?gid=1023442601&single=true&output=csv', 
    
    // Заглушка для фото
    placeholderImage: 'https://s6.iimage.su/s/05/g6QcWpxxrKi4shjWNuvvHO7BcPELg73RviDN0SNH.png', 
    
    // Настройки каталога
    itemsPerPage: 12,
    cacheTime: 1, // Часы

    // --- КОНТАКТЫ И СОЦСЕТИ ---
    // Если поле оставить пустым (''), иконка на сайте скроется автоматически!
    contacts: {
        phoneDisplay: '+7 (981) 888-13-37', // Как отображается
        phoneLink: '+79818881337',          // Как набирается (для href="tel:...")
        email: 'info@rassvet-s.ru',
        address: 'г. Санкт-Петербург, ул. Промышленная, д. 42',
        
        // Ссылки на соцсети
        telegram: 'https://t.me/your_username', // Поставь свой юзернейм
        whatsapp: 'https://wa.me/79818881337',
        vk: 'https://vk.com/your_group',        // Ссылка на группу
        avito: 'https://www.avito.ru/user/...'  // Ссылка на профиль
    },

    // Настройки Telegram бота (для заказов)
    tgBotToken: '8574440126:AAEvK0XXXrzTkchRfv1HtiCyO9k9Qiyu01o', 
    tgChatId: '1017718880' 
};