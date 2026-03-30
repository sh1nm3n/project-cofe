const API_URL = 'http://localhost:3000/api';
let allMenuItems = [];

// === ЗАГРУЗКА МЕНЮ ===
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        allMenuItems = await response.json();
        
        renderMenu(allMenuItems);
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
        document.getElementById('menuContainer').innerHTML = 
            '<p style="text-align: center; color: #ff6b6b;">Ошибка загрузки меню</p>';
    }
}

// === ОТРИСОВКА МЕНЮ ===
function renderMenu(items) {
    const container = document.getElementById('menuContainer');
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Меню пустое</p>';
        return;
    }

    // Группировка по категориям
    const categories = {};
    items.forEach(item => {
        const cat = item.category || 'Другое';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push(item);
    });

    let html = '';
    for (const [category, categoryItems] of Object.entries(categories)) {
        html += `
            <div class="menu-category" style="grid-column: 1 / -1; margin: 40px 0 20px;">
                <h3 style="color: var(--accent); font-family: var(--font-heading); font-size: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                    ${category}
                </h3>
            </div>
        `;
        
        categoryItems.forEach(item => {
            html += `
                <div class="menu-card" data-category="${item.category || 'Другое'}">
                    <div class="menu-card-header">
                        <h3>${item.name}</h3>
                        <span class="dots"></span>
                        <span class="price">${item.price} ₽</span>
                    </div>
                    <p>${item.description || ''}</p>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

// === ФИЛЬТР ПО КАТЕГОРИЯМ ===
function filterMenu(category) {
    if (category === 'all') {
        renderMenu(allMenuItems);
    } else {
        const filtered = allMenuItems.filter(item => item.category === category);
        renderMenu(filtered);
    }
}

// === ОБРАБОТЧИКИ ФИЛЬТРОВ ===
document.querySelectorAll('.category-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterMenu(btn.dataset.category);
    });
});

// === СТАТУС ПОЛЬЗОВАТЕЛЯ ===
function checkUserStatus() {
    const user = JSON.parse(localStorage.getItem('user-data') || 'null');
    const token = localStorage.getItem('user-token');
    
    const userStatus = document.getElementById('userStatus');
    const authLink = document.getElementById('authLink');
    
    if (user && token) {
        userStatus.textContent = `👤 ${user.username}`;
        authLink.textContent = 'Выйти';
        authLink.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('user-token');
            localStorage.removeItem('user-data');
            location.reload();
        };
    } else {
        userStatus.textContent = '';
        authLink.textContent = 'Войти';
        authLink.href = 'auth.html';
        authLink.onclick = null;
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    checkUserStatus();
});