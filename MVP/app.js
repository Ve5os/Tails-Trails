// ============================================
// TRAILS & TAILS - Общая логика
// ============================================

(function() {
    "use strict";

    const ROUTES_KEY = 'trails_tails_routes';
    const USER_KEY = 'trails_tails_user';

    let routesData = [];
    let userData = {
        name: 'Алексей П.',
        location: 'Москва',
        avatar: null,
        pets: [
            { name: 'Рекс', breed: 'овчарка' },
            { name: 'Муся', breed: 'корги' }
        ]
    };
    let userWalkingRouteId = null;

    // ===== ЗАГРУЗКА МАРШРУТОВ =====
    function loadRoutes() {
        const stored = localStorage.getItem(ROUTES_KEY);
        if (stored) {
            try {
                routesData = JSON.parse(stored);
                routesData.forEach(r => {
                    if (!r.walkersList) r.walkersList = [];
                    if (r.walkers === undefined) r.walkers = r.walkersList.length;
                });
                return;
            } catch(e) {}
        }
        // Начальные данные
        routesData = [
            { id: 1, name: '🌳 Парк Горького', distance: 4.2, active: true, favorite: false, coords: [55.735, 37.605], walkers: 0, walkersList: [], description: 'Отличное место для прогулок с собаками. Есть площадка для выгула.' },
            { id: 2, name: '🐕 Сокольники', distance: 6.8, active: true, favorite: true, coords: [55.796, 37.674], walkers: 2, walkersList: [{ name: 'Екатерина', pet: 'Бим (лабрадор)' }, { name: 'Дмитрий', pet: 'Шарик (дворняга)' }], description: 'Крупнейший парк с множеством тропинок и зон для выгула.' },
            { id: 3, name: '🏞️ Воробьёвы горы', distance: 3.1, active: false, favorite: false, coords: [55.710, 37.546], walkers: 0, walkersList: [], description: 'Живописный вид на Москву-реку. Отличные маршруты для активных собак.' },
            { id: 4, name: '🌸 Царицыно', distance: 5.5, active: true, favorite: false, coords: [55.615, 37.682], walkers: 1, walkersList: [{ name: 'Анна', pet: 'Тося (шпиц)' }], description: 'Дворцовый парк с прудами и аллеями. Очень уютно.' },
            { id: 5, name: '🏰 Коломенское', distance: 7.2, active: true, favorite: true, coords: [55.667, 37.673], walkers: 3, walkersList: [{ name: 'Сергей', pet: 'Граф (овчарка)' }, { name: 'Ольга', pet: 'Мила (корги)' }, { name: 'Екатерина', pet: 'Бим (лабрадор)' }], description: 'Музей-заповедник с огромной территорией. Любимое место собачников.' },
            { id: 6, name: '🌿 Нескучный сад', distance: 3.8, active: true, favorite: false, coords: [55.725, 37.595], walkers: 0, walkersList: [], description: 'Тихий парк в центре города. Идеально для спокойных прогулок.' }
        ];
        saveRoutes();
    }

    function saveRoutes() {
        localStorage.setItem(ROUTES_KEY, JSON.stringify(routesData));
        updateTotalWalkers();
    }

    // ===== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ =====
    function loadUser() {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                userData = {
                    ...userData,
                    ...parsed,
                    pets: Array.isArray(parsed.pets) ? parsed.pets : userData.pets
                };
                return;
            } catch(e) {
                console.warn('Ошибка загрузки данных пользователя', e);
            }
        }
        saveUser();
    }

    function saveUser() {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        if (typeof renderProfile === 'function') renderProfile();
    }

    // ===== ФУНКЦИИ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЕМ =====
    function updateUserProfile(updates) {
        Object.assign(userData, updates);
        saveUser();
    }

    function addPet(name, breed) {
        if (!name || !name.trim()) return false;
        userData.pets.push({
            name: name.trim(),
            breed: (breed && breed.trim()) || 'Неизвестная порода'
        });
        saveUser();
        return true;
    }

    function removePet(index) {
        if (typeof index !== 'number' || index < 0 || index >= userData.pets.length) {
            console.warn('Некорректный индекс для удаления питомца:', index);
            return false;
        }
        userData.pets.splice(index, 1);
        saveUser();
        return true;
    }

    function editPet(index, name, breed) {
        if (typeof index !== 'number' || index < 0 || index >= userData.pets.length) {
            console.warn('Некорректный индекс для редактирования питомца:', index);
            return false;
        }
        if (!name || !name.trim()) return false;
        userData.pets[index] = {
            name: name.trim(),
            breed: (breed && breed.trim()) || 'Неизвестная порода'
        };
        saveUser();
        return true;
    }

    function getCurrentUserPet() {
        if (userData.pets && userData.pets.length > 0) {
            const p = userData.pets[0];
            return p.name + ' (' + p.breed + ')';
        }
        return 'Без питомца';
    }

    // ===== ОБЩИЕ ФУНКЦИИ =====
    function getFavorites() { return routesData.filter(r => r.favorite === true); }
    function getTotalWalkers() { return routesData.reduce((sum, r) => sum + (r.walkers || 0), 0); }

    function toggleFavorite(id) {
        const route = routesData.find(r => r.id === id);
        if (route) {
            route.favorite = !route.favorite;
            saveRoutes();
            renderAll();
            if (popupOpenedRouteId === id) renderPopup(id);
        }
    }

    // ===== УПРАВЛЕНИЕ ПРОГУЛКАМИ =====
    function toggleWalking(routeId) {
        const route = routesData.find(r => r.id === routeId);
        if (!route) return;

        if (userWalkingRouteId === routeId) {
            route.walkersList = route.walkersList.filter(w => w.name !== userData.name);
            route.walkers = route.walkersList.length;
            userWalkingRouteId = null;
        } else {
            if (userWalkingRouteId !== null) {
                const oldRoute = routesData.find(r => r.id === userWalkingRouteId);
                if (oldRoute) {
                    oldRoute.walkersList = oldRoute.walkersList.filter(w => w.name !== userData.name);
                    oldRoute.walkers = oldRoute.walkersList.length;
                }
            }
            const userPet = getCurrentUserPet();
            if (!route.walkersList.find(w => w.name === userData.name)) {
                route.walkersList.push({ name: userData.name, pet: userPet });
            }
            route.walkers = route.walkersList.length;
            route.active = true;
            userWalkingRouteId = routeId;
        }
        saveRoutes();
        renderAll();
        if (popupOpenedRouteId === routeId) renderPopup(routeId);
    }

    function isUserWalking(routeId) {
        return userWalkingRouteId === routeId;
    }

    function updateTotalWalkers() {
        const total = getTotalWalkers();
        const el = document.getElementById('total-walkers-map');
        if (el) el.textContent = total;
    }

    // ===== POPUP =====
    let popupOpenedRouteId = null;

    function openPopup(routeId) {
        const route = routesData.find(r => r.id === routeId);
        if (!route) return;
        popupOpenedRouteId = routeId;
        renderPopup(routeId);
        document.getElementById('routePopup').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePopup() {
        document.getElementById('routePopup').classList.remove('active');
        document.body.style.overflow = '';
        popupOpenedRouteId = null;
    }

    function renderPopup(routeId) {
        const route = routesData.find(r => r.id === routeId);
        if (!route) return;

        document.getElementById('popup-title').textContent = route.name;
        const statusText = route.active ? '🟢 Активен' : '🔴 Неактивен';
        document.getElementById('popup-subtitle').textContent = `📍 ${route.distance} км · ${statusText}`;
        document.getElementById('popup-distance').textContent = route.distance;
        document.getElementById('popup-walkers').textContent = route.walkers || 0;
        document.getElementById('popup-fav-status').textContent = route.favorite ? '⭐ В избранном' : '☆ Добавить в избранное';

        const favBtn = document.getElementById('popup-toggle-fav');
        favBtn.innerHTML = route.favorite ? '<i class="fas fa-star"></i> Убрать' : '<i class="fas fa-star"></i> В избранное';
        favBtn.onclick = () => toggleFavorite(routeId);

        const listContainer = document.getElementById('popup-walkers-list');
        const emptyMsg = document.getElementById('popup-no-walkers');
        listContainer.innerHTML = '';

        if (route.walkersList && route.walkersList.length > 0) {
            emptyMsg.style.display = 'none';
            route.walkersList.forEach(w => {
                const div = document.createElement('div');
                div.className = 'popup-walker';
                const initial = w.name.charAt(0);
                div.innerHTML = `
                    <div class="walker-avatar">${initial}</div>
                    <div class="walker-info">
                        <div class="walker-name">${w.name}</div>
                        <div class="walker-pets"><i class="fas fa-paw"></i> ${w.pet || '🐕'}</div>
                    </div>
                    ${w.name === userData.name ? '<span style="color: var(--green-light); font-size: 0.75rem;"><i class="fas fa-check-circle"></i> Вы</span>' : ''}
                `;
                listContainer.appendChild(div);
            });
        } else {
            emptyMsg.style.display = 'block';
        }

        const joinBtn = document.getElementById('popup-join-btn');
        if (isUserWalking(routeId)) {
            joinBtn.innerHTML = '<i class="fas fa-times"></i> Выйти с прогулки';
            joinBtn.className = 'btn-danger-dark';
            joinBtn.style.width = '100%';
            joinBtn.style.justifyContent = 'center';
            joinBtn.style.display = 'flex';
            joinBtn.style.gap = '8px';
        } else {
            joinBtn.innerHTML = '<i class="fas fa-walking"></i> Присоединиться к прогулке';
            joinBtn.className = 'btn-brown';
            joinBtn.style.width = '100%';
            joinBtn.style.justifyContent = 'center';
            joinBtn.style.display = 'flex';
            joinBtn.style.gap = '8px';
        }
        joinBtn.onclick = () => toggleWalking(routeId);
    }

    // ===== РЕНДЕР КАРТОЧКИ =====
    function renderCard(route, isFavoriteList) {
        const statusClass = route.active ? 'live' : 'inactive';
        const statusText = route.active ? '🔴 Сейчас гуляют' : 'Неактивен';
        const walking = isUserWalking(route.id);
        const walkersInfo = route.walkers && route.walkers > 0 ? `👥 ${route.walkers} чел.` : '';

        const card = document.createElement('div');
        card.className = 'route-card' + (walking ? ' walking' : '');
        card.dataset.id = route.id;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div class="route-title">
                        ${route.name}
                        <span class="walking-badge"><i class="fas fa-walking"></i> Гуляю</span>
                    </div>
                    <div class="route-meta">
                        <span><i class="fas fa-route"></i> ${route.distance} км</span>
                        <span class="route-status ${statusClass}">${statusText}</span>
                        ${walkersInfo ? `<span><i class="fas fa-users"></i> ${walkersInfo}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="info-btn" title="Подробнее"><i class="fas fa-cog"></i></button>
                <button class="fav-btn ${route.favorite ? 'active' : ''}" title="${route.favorite ? 'Убрать из избранного' : 'В избранное'}">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        `;

        card.addEventListener('click', function(e) {
            if (e.target.closest('.card-actions')) return;
            if (isFavoriteList) {
                const id = parseInt(this.dataset.id);
                toggleWalking(id);
                this.classList.toggle('walking');
                const badge = this.querySelector('.walking-badge');
                if (badge) badge.style.display = isUserWalking(id) ? 'inline-block' : 'none';
                updateTotalWalkers();
                const routeData = routesData.find(r => r.id === id);
                if (routeData) {
                    const metaSpan = this.querySelector('.route-meta');
                    const walkersSpan = metaSpan.querySelector('.route-meta > span:last-child');
                    if (routeData.walkers > 0) {
                        if (!walkersSpan || !walkersSpan.innerHTML.includes('👥')) {
                            const newSpan = document.createElement('span');
                            newSpan.innerHTML = `<i class="fas fa-users"></i> 👥 ${routeData.walkers} чел.`;
                            metaSpan.appendChild(newSpan);
                        } else if (walkersSpan) {
                            walkersSpan.innerHTML = `<i class="fas fa-users"></i> 👥 ${routeData.walkers} чел.`;
                        }
                    } else {
                        if (walkersSpan && walkersSpan.innerHTML.includes('👥')) {
                            walkersSpan.remove();
                        }
                    }
                }
            } else {
                const id = parseInt(this.dataset.id);
                openPopup(id);
            }
        });

        const infoBtn = card.querySelector('.info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(card.dataset.id);
                openPopup(id);
            });
        }

        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(card.dataset.id);
            toggleFavorite(id);
            const routeData = routesData.find(r => r.id === id);
            if (routeData) this.classList.toggle('active', routeData.favorite);
        });

        return card;
    }

    // ===== РЕНДЕР ВСЕГО =====
    function renderFavorites() {
        const container = document.getElementById('favorites-list');
        if (!container) return; // если контейнера нет (например, на странице маршрутов), просто выходим
        const empty = document.getElementById('fav-empty');
        const favs = getFavorites();
        const countEl = document.getElementById('fav-count');
        if (countEl) countEl.textContent = favs.length;

        if (favs.length === 0) {
            container.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        container.innerHTML = '';
        favs.forEach(route => container.appendChild(renderCard(route, true)));
    }

    function renderAllRoutes() {
        const container = document.getElementById('all-routes-list');
        if (!container) return;
        container.innerHTML = '';
        routesData.forEach(route => container.appendChild(renderCard(route, false)));
    }

    function updateStats() {
        const statRoutes = document.getElementById('stat-routes');
        const statFav = document.getElementById('stat-fav');
        const statWalks = document.getElementById('stat-walks');
        if (statRoutes) statRoutes.textContent = routesData.length;
        if (statFav) statFav.textContent = getFavorites().length;
        if (statWalks) statWalks.textContent = getTotalWalkers();
        updateTotalWalkers();
    }

    function renderAll() {
        renderFavorites();
        renderAllRoutes();
        updateStats();
        if (typeof updateMapMarkers === 'function') updateMapMarkers();
    }

    // ===== ДОБАВЛЕНИЕ МАРШРУТА =====
    function addDemoRoute() {
        const newId = routesData.length ? Math.max(...routesData.map(r => r.id)) + 1 : 1;
        const newRoute = {
            id: newId,
            name: '🐾 Новый маршрут #' + newId,
            distance: (Math.random() * 8 + 1).toFixed(1),
            active: true,
            favorite: false,
            coords: [55.70 + (Math.random() - 0.5) * 0.25, 37.60 + (Math.random() - 0.5) * 0.25],
            walkers: 0,
            walkersList: [],
            description: 'Новый маршрут для прогулок с собаками. Присоединяйтесь!'
        };
        routesData.push(newRoute);
        saveRoutes();
        renderAll();
        if (window.location.pathname.indexOf('routes.html') === -1) {
            window.location.href = 'routes.html';
        }
    }

    function resetData() {
        if (confirm('Сбросить все данные? Ваши изменения удалятся.')) {
            localStorage.removeItem(ROUTES_KEY);
            localStorage.removeItem(USER_KEY);
            loadRoutes();
            loadUser();
            userWalkingRouteId = null;
            renderAll();
            if (typeof initMap === 'function') initMap();
            if (typeof renderProfile === 'function') renderProfile();
        }
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    function initApp() {
        loadRoutes();
        loadUser();
        renderAll();

        const addBtn = document.getElementById('add-demo-route');
        if (addBtn) addBtn.addEventListener('click', addDemoRoute);

        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) resetBtn.addEventListener('click', resetData);

        const popupClose = document.getElementById('popupClose');
        const popupOverlay = document.getElementById('routePopup');
        if (popupClose) popupClose.addEventListener('click', closePopup);
        if (popupOverlay) {
            popupOverlay.addEventListener('click', function(e) {
                if (e.target === this) closePopup();
            });
        }

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage) item.classList.add('active');
        });
    }

    window.TrailsTails = {
        initApp,
        openPopup,
        closePopup,
        renderAll,
        routesData: () => routesData,
        userData: () => userData,
        isUserWalking,
        toggleWalking,
        toggleFavorite,
        getFavorites,
        getTotalWalkers,
        loadRoutes,
        saveRoutes,
        loadUser,
        saveUser,
        updateUserProfile,
        addPet,
        removePet,
        editPet,
        getCurrentUserPet,
        resetData,
        renderFavorites,
        renderAllRoutes,
        updateStats
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();