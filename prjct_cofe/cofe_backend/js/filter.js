const API_URL = 'http://localhost:3000/api';
let allMenuItems = [];

async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        allMenuItems = await response.json();
        
        renderMenu(allMenuItems);
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
        document.getElementById('menuContainer').innerHTML = 
            '<p style="text-align: center; color: #ff6b6b; padding: 60px 0;">Ошибка загрузки меню</p>';
    }
}

function renderMenu(items) {
    const container = document.getElementById('menuContainer');
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-soft); padding: 60px 0;">Меню пустое</p>';
        return;
    }

    let html = '';
    items.forEach(item => {
        html += `
            <div class="menu-item" data-category="${item.category || 'Другое'}">
                <div class="menu-item-info">
                    <div class="menu-item-header">
                        <h3>${item.name}</h3>
                        <span class="price">${item.price} ₽</span>
                    </div>
                    <p class="menu-item-desc">${item.description || ''}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function filterMenu(category) {
    const items = document.querySelectorAll('.menu-item');
    
    items.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        
        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
            item.style.animation = 'fadeIn 0.4s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        
        btn.classList.add('active');
        
        const category = btn.getAttribute('data-category');
        filterMenu(category);
    });
});

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

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    checkUserStatus();
});