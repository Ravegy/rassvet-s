(function () {
    'use strict';

    const state = {
        cart: {},
        favorites: new Set(),
        cartCount: 0,
        favoritesCount: 0
    };

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeUrl(url, fallback) {
        const raw = String(url || '').trim();
        if (raw.startsWith('/') && !raw.startsWith('//')) {
            return raw;
        }
        if (/^https?:\/\//i.test(raw)) {
            return raw;
        }
        return fallback || '/';
    }

    function formatPrice(value) {
        const num = Number(value);
        if (!Number.isFinite(num) || num <= 0) {
            return 'По запросу';
        }
        return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(num)) + ' ₽';
    }

    function toast(message, type, duration) {
        const container = document.getElementById('toast-container');
        if (!container || !message) {
            return;
        }
        const kind = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
        const timeout = typeof duration === 'number' ? duration : 4000;

        const el = document.createElement('div');
        el.className = 'toast toast--' + kind;
        el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
        el.innerHTML = '<div class="toast__body">' + escapeHtml(message) + '</div>'
            + '<button type="button" class="toast__close" aria-label="Закрыть">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
            + '</button>';

        const remove = function () {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        };

        const closeBtn = el.querySelector('.toast__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', remove);
        }

        container.appendChild(el);
        if (timeout > 0) {
            window.setTimeout(remove, timeout);
        }
    }

    async function api(url, options) {
        const opts = Object.assign({ method: 'GET', headers: {} }, options || {});
        const method = String(opts.method || 'GET').toUpperCase();
        const headers = Object.assign({
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }, opts.headers || {});

        if (method !== 'GET' && method !== 'HEAD') {
            const csrf = getCsrfToken();
            if (csrf) {
                headers['X-CSRF-Token'] = csrf;
            }
            if (opts.body && !(opts.body instanceof FormData) && typeof opts.body === 'object') {
                headers['Content-Type'] = 'application/json';
                opts.body = JSON.stringify(opts.body);
            }
        }

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: opts.body,
            credentials: 'same-origin',
            signal: opts.signal
        });

        const text = await response.text();
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { success: false, error: 'Некорректный ответ сервера.' };
            }
        }

        if (!response.ok || data.success === false) {
            const err = new Error(data.error || 'Ошибка запроса (' + response.status + ').');
            err.status = response.status;
            err.data = data;
            throw err;
        }

        return data;
    }

    function updateBodyScroll() {
        const hasOpenDrawer = Boolean(document.querySelector('[data-drawer].is-open'));
        const hasOpenModal = Boolean(document.querySelector('.modal-backdrop.is-open'));
        document.body.classList.toggle('no-scroll', hasOpenDrawer || hasOpenModal);
    }

    function initTheme() {
        const buttons = document.querySelectorAll('[data-theme-toggle]');
        if (!buttons.length) {
            return;
        }
        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const next = isDark ? 'light' : 'dark';
                if (next === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                try {
                    localStorage.setItem('theme', next);
                } catch (e) {}
            });
        });
    }

    function initDrawer() {
        const drawer = document.querySelector('[data-drawer]');
        const openBtn = document.querySelector('[data-drawer-open]');
        if (!drawer || !openBtn) {
            return;
        }

        const closeBtns = drawer.querySelectorAll('[data-drawer-close]');

        function open() {
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
            openBtn.setAttribute('aria-expanded', 'true');
            updateBodyScroll();
        }

        function close() {
            drawer.classList.remove('is-open');
            drawer.setAttribute('aria-hidden', 'true');
            openBtn.setAttribute('aria-expanded', 'false');
            updateBodyScroll();
        }

        openBtn.addEventListener('click', open);
        closeBtns.forEach(function (btn) {
            btn.addEventListener('click', close);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
                close();
            }
        });
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) {
            return;
        }
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        updateBodyScroll();
    }

    function closeModal(modalEl) {
        const modal = typeof modalEl === 'string' ? document.getElementById(modalEl) : modalEl;
        if (!modal) {
            return;
        }
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        updateBodyScroll();
    }

    function initModals() {
        document.addEventListener('click', function (e) {
            const opener = e.target.closest('[data-modal-open]');
            if (opener) {
                e.preventDefault();
                openModal(opener.getAttribute('data-modal-open'));
                return;
            }

            const closer = e.target.closest('[data-modal-close]');
            if (closer) {
                const backdrop = closer.closest('.modal-backdrop');
                if (backdrop) {
                    closeModal(backdrop);
                }
                return;
            }

            if (e.target.classList && e.target.classList.contains('modal-backdrop') && e.target.classList.contains('is-open')) {
                closeModal(e.target);
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') {
                return;
            }
            const opened = document.querySelectorAll('.modal-backdrop.is-open');
            if (opened.length) {
                closeModal(opened[opened.length - 1]);
            }
        });
    }

    function initTabs() {
        document.querySelectorAll('[data-tabs]').forEach(function (root) {
            const buttons = Array.from(root.querySelectorAll('[data-tab-btn]'));
            const panels = Array.from(root.querySelectorAll('[data-tab-panel]'));
            if (!buttons.length) {
                return;
            }

            buttons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const target = btn.getAttribute('data-tab-btn');
                    buttons.forEach(function (b) {
                        const active = b === btn;
                        b.classList.toggle('is-active', active);
                        b.setAttribute('aria-selected', active ? 'true' : 'false');
                    });
                    panels.forEach(function (panel) {
                        const match = panel.getAttribute('data-tab-panel') === target;
                        panel.hidden = !match;
                    });
                });
            });
        });
    }

    function initHeaderSearch() {
        const container = document.querySelector('[data-header-search]');
        if (!container) {
            return;
        }
        const input = container.querySelector('[data-search-input]');
        const clearBtn = container.querySelector('[data-search-clear]');
        const dropdown = container.querySelector('[data-search-dropdown]');
        if (!input || !dropdown) {
            return;
        }

        let debounceId = 0;
        let controller = null;
        let activeIndex = -1;

        function toggleClear() {
            if (clearBtn) {
                clearBtn.hidden = input.value.trim().length === 0;
            }
        }

        function hideDropdown() {
            dropdown.hidden = true;
            activeIndex = -1;
        }

        function showState(text) {
            dropdown.innerHTML = '<div class="search-dropdown__state">' + escapeHtml(text) + '</div>';
            dropdown.hidden = false;
            activeIndex = -1;
        }

        function renderResults(items, query, total) {
            if (!items.length) {
                showState('По запросу «' + query + '» ничего не найдено');
                return;
            }

            const rows = items.map(function (item) {
                const code = escapeHtml(item.part_number || '');
                const name = escapeHtml(item.name || '');
                const href = escapeHtml(safeUrl(item.url || ('/part/' + encodeURIComponent(item.part_number || '')), '/stock'));
                const inStock = Boolean(item.in_stock || Number(item.stock_qty) > 0);
                const qty = Number(item.stock_qty) || 0;
                const stockLabel = inStock ? (qty > 0 ? 'В наличии: ' + qty + ' шт.' : 'В наличии') : 'Под заказ';
                const stockClass = inStock ? 'search-dropdown__stock--in' : 'search-dropdown__stock--order';
                const price = item.price ? '<span class="search-dropdown__price">' + escapeHtml(formatPrice(item.price)) + '</span>' : '';
                const thumb = item.image
                    ? '<img class="search-dropdown__thumb" src="' + escapeHtml(safeUrl(item.image, '/images/logo.webp')) + '" alt="" loading="lazy">'
                    : '';

                return '<a class="search-dropdown__item" href="' + href + '">'
                    + thumb
                    + '<span class="search-dropdown__info">'
                    + '<span class="search-dropdown__top"><span class="search-dropdown__code">' + code + '</span></span>'
                    + '<span class="search-dropdown__name">' + name + '</span>'
                    + '</span>'
                    + '<span class="search-dropdown__meta">'
                    + price
                    + '<span class="search-dropdown__stock ' + stockClass + '"><span class="search-dropdown__dot"></span>' + escapeHtml(stockLabel) + '</span>'
                    + '</span>'
                    + '</a>';
            }).join('');

            const footerCount = typeof total === 'number' && total > items.length
                ? '<span>Найдено: ' + total + '</span>'
                : '<span>Быстрый переход</span>';

            dropdown.innerHTML = '<div class="search-dropdown__list">' + rows + '</div>'
                + '<div class="search-dropdown__footer">'
                + footerCount
                + '<a class="search-dropdown__all" href="/stock?q=' + encodeURIComponent(query) + '">Показать все на складе</a>'
                + '</div>';
            dropdown.hidden = false;
            activeIndex = -1;
        }

        async function runSearch(query) {
            if (controller) {
                controller.abort();
            }
            controller = new AbortController();
            showState('Поиск...');

            try {
                const data = await api('/api/search?q=' + encodeURIComponent(query), { signal: controller.signal });
                const list = Array.isArray(data.items) ? data.items : (Array.isArray(data.results) ? data.results : []);
                renderResults(list, query, data.total);
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    return;
                }
                showState('Не удалось выполнить поиск. Попробуйте ещё раз.');
            }
        }

        input.addEventListener('input', function () {
            toggleClear();
            const q = input.value.trim();
            window.clearTimeout(debounceId);
            if (q.length < 2) {
                if (controller) {
                    controller.abort();
                }
                hideDropdown();
                return;
            }
            debounceId = window.setTimeout(function () {
                runSearch(q);
            }, 220);
        });

        input.addEventListener('focus', function () {
            if (dropdown.innerHTML.trim() !== '' && input.value.trim().length >= 2) {
                dropdown.hidden = false;
            }
        });

        input.addEventListener('keydown', function (e) {
            if (dropdown.hidden) {
                return;
            }
            const items = dropdown.querySelectorAll('.search-dropdown__item');
            if (!items.length) {
                if (e.key === 'Escape') {
                    hideDropdown();
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
                items.forEach(function (el, idx) {
                    el.classList.toggle('is-active', idx === activeIndex);
                });
                items[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
                items.forEach(function (el, idx) {
                    el.classList.toggle('is-active', idx === activeIndex);
                });
                items[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
                e.preventDefault();
                window.location.href = items[activeIndex].getAttribute('href');
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                input.value = '';
                toggleClear();
                hideDropdown();
                input.focus();
            });
        }

        document.addEventListener('click', function (e) {
            if (!container.contains(e.target)) {
                hideDropdown();
            }
        });

        toggleClear();
    }

    function applyStateToDom() {
        document.querySelectorAll('[data-cart-count]').forEach(function (el) {
            el.setAttribute('data-count', String(state.cartCount));
            el.textContent = state.cartCount > 0 ? String(state.cartCount) : '';
        });

        document.querySelectorAll('[data-favorites-count]').forEach(function (el) {
            el.setAttribute('data-count', String(state.favoritesCount));
            el.textContent = state.favoritesCount > 0 ? String(state.favoritesCount) : '';
        });

        document.querySelectorAll('[data-toggle-fav]').forEach(function (btn) {
            const code = btn.getAttribute('data-toggle-fav');
            const active = code ? state.favorites.has(code) : false;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        document.querySelectorAll('[data-add-cart]').forEach(function (btn) {
            const code = btn.getAttribute('data-add-cart');
            const qty = code && state.cart[code] ? Number(state.cart[code]) : 0;
            btn.classList.toggle('is-in-cart', qty > 0);
            const label = btn.getAttribute(qty > 0 ? 'data-label-added' : 'data-label-default');
            if (label) {
                btn.textContent = label;
            }
        });

        document.dispatchEvent(new CustomEvent('app:state', {
            detail: {
                cart: Object.assign({}, state.cart),
                favorites: Array.from(state.favorites),
                cartCount: state.cartCount,
                favoritesCount: state.favoritesCount
            }
        }));
    }

    function hydrateState(payload) {
        if (!payload || typeof payload !== 'object') {
            return;
        }
        if (payload.cart && typeof payload.cart === 'object') {
            state.cart = payload.cart;
        }
        if (Array.isArray(payload.favorites)) {
            state.favorites = new Set(payload.favorites.map(String));
        }
        if (typeof payload.cart_count === 'number') {
            state.cartCount = payload.cart_count;
        } else {
            state.cartCount = Object.values(state.cart).reduce(function (sum, v) {
                return sum + (Number(v) || 0);
            }, 0);
        }
        if (typeof payload.favorites_count === 'number') {
            state.favoritesCount = payload.favorites_count;
        } else {
            state.favoritesCount = state.favorites.size;
        }
        applyStateToDom();
    }

    async function syncState() {
        try {
            const data = await api('/api/state');
            hydrateState(data);
        } catch (e) {}
    }

    async function mutateCartFav(action, partNumber, qty, triggerBtn) {
        if (!partNumber) {
            return null;
        }
        if (triggerBtn) {
            triggerBtn.classList.add('is-loading');
            triggerBtn.disabled = true;
        }
        try {
            const data = await api('/api/cart_fav', {
                method: 'POST',
                body: {
                    action: action,
                    part_number: partNumber,
                    qty: qty || 1
                }
            });
            hydrateState(data);
            if (data.message) {
                toast(data.message, 'success');
            }
            return data;
        } catch (err) {
            toast(err.message || 'Не удалось обновить данные.', 'error');
            return null;
        } finally {
            if (triggerBtn) {
                triggerBtn.classList.remove('is-loading');
                triggerBtn.disabled = false;
            }
        }
    }

    function initActions() {
        document.addEventListener('click', function (e) {
            const cartBtn = e.target.closest('[data-add-cart]');
            if (cartBtn) {
                e.preventDefault();
                const code = cartBtn.getAttribute('data-add-cart');
                const qtySelector = cartBtn.getAttribute('data-qty-source');
                let qty = Number(cartBtn.getAttribute('data-qty')) || 1;
                if (qtySelector) {
                    const qtyEl = document.querySelector(qtySelector);
                    if (qtyEl && Number(qtyEl.value) > 0) {
                        qty = Number(qtyEl.value);
                    }
                }
                mutateCartFav('cart_add', code, qty, cartBtn);
                return;
            }

            const favBtn = e.target.closest('[data-toggle-fav]');
            if (favBtn) {
                e.preventDefault();
                const code = favBtn.getAttribute('data-toggle-fav');
                mutateCartFav('fav_toggle', code, 1, favBtn);
                return;
            }

            const copyBtn = e.target.closest('[data-copy]');
            if (copyBtn) {
                e.preventDefault();
                const text = copyBtn.getAttribute('data-copy') || '';
                if (!text) {
                    return;
                }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        toast('Скопировано: ' + text, 'success', 2200);
                    }).catch(function () {
                        toast('Не удалось скопировать.', 'error', 2200);
                    });
                }
            }
        });
    }

    window.RassvetApp = {
        api: api,
        toast: toast,
        escapeHtml: escapeHtml,
        formatPrice: formatPrice,
        openModal: openModal,
        closeModal: closeModal,
        syncState: syncState,
        mutateCartFav: mutateCartFav,
        hydrateState: hydrateState,
        getState: function () {
            return {
                cart: Object.assign({}, state.cart),
                favorites: Array.from(state.favorites),
                cartCount: state.cartCount,
                favoritesCount: state.favoritesCount
            };
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        initTheme();
        initDrawer();
        initModals();
        initTabs();
        initHeaderSearch();
        initActions();
        syncState();
    });
})();