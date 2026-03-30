const API_BASE_URL = 'http://localhost:3000/api'; 

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        window.location.href = 'admin-login.html';
        return;
    }

    return response;
}

async function fetchMenuItemsFromAPI() {
    try {
        const response = await apiCall('/menu');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Ошибка при загрузке меню с сервера:", error);
        alert("Не удалось загрузить меню. Проверьте консоль.");
        return [];
    }
}

async function addMenuItemToAPI(itemData) {
    try {
        const response = await apiCall('/menu', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
        if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при добавлении');
        }
        return await response.json();
    } catch (error) {
        console.error("Ошибка при добавлении позиции:", error);
        alert(`Не удалось добавить позицию: ${error.message}`);
    }
}

async function updateMenuItemOnAPI(id, itemData) {
    try {
        const response = await apiCall(`/menu/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
        if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при обновлении');
        }
        return await response.json();
    } catch (error) {
        console.error("Ошибка при обновлении позиции:", error);
        alert(`Не удалось обновить позицию: ${error.message}`);
    }
}

async function deleteMenuItemFromAPI(id) {
    try {
        const response = await apiCall(`/menu/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при удалении');
        }
        return await response.json();
    } catch (error) {
        console.error("Ошибка при удалении позиции:", error);
        alert(`Не удалось удалить позицию: ${error.message}`);
    }
}

if (!localStorage.getItem('adminToken')) {
    window.location.href = 'admin_login.html';
}

document.getElementById('welcome-username').textContent = localStorage.getItem('adminUsername') || 'Администратор';

let menuItems = [];

async function loadMenuItems() {
    menuItems = await fetchMenuItemsFromAPI();
    renderMenuList();
}

function renderMenuList() {
    const listElement = document.getElementById('menuList');
    listElement.innerHTML = '';

    menuItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.dataset.id = item.id;

        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
    
            <div class="price">${item.price} руб.</div>
            <div class="menu-actions">
                <button class="btn-edit" onclick="startEditing(${item.id})">Редактировать</button>
                <button class="btn-delete" onclick="deleteItem(${item.id})">Удалить</button>
            </div>
            <div id="edit-form-${item.id}" class="edit-form" style="display:none;">
                <div class="form-group">
                    <label>Название:</label>
                    <input type="text" id="edit-name-${item.id}" value="${item.name}">
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea id="edit-desc-${item.id}" rows="2">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Цена:</label>
                    <input type="number" id="edit-price-${item.id}" value="${item.price}" step="0.01" min="0">
                </div>
                <button class="btn-submit" onclick="saveEdit(${item.id})">Сохранить</button>
                <button onclick="cancelEdit(${item.id})">Отмена</button>
            </div>
        `;
        listElement.appendChild(itemDiv);
    });
}

// === ОБРАБОТКА ФОРМЫ ===
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 🔧 Получаем категорию ПРЯМО ИЗ ФОРМЫ
        const categorySelect = document.getElementById('itemCategory');
        console.log('📋 Select найден:', categorySelect !== null);
        console.log('📋 Категория:', categorySelect?.value);
        
        const itemData = {
            name: document.getElementById('itemName').value,
            category: categorySelect ? categorySelect.value : 'Классика и Авторские напитки',
            price: parseFloat(document.getElementById('itemPrice').value),
            description: document.getElementById('itemDescription').value
        };
        
        console.log('📦 Отправка данных:', itemData);
        
        try {
            await addMenuItemToAPI(itemData);
            showAlert('✅ Товар успешно добавлен!', 'success');
            document.getElementById('addItemForm').reset();
            loadMenu();
        } catch (error) {
            console.error('Ошибка добавления:', error);
            showAlert('❌ ' + error.message, 'error');
        }
    });
});

function startEditing(id) {
    menuItems.forEach(item => {
        if (item.id === id) {
            document.querySelector(`#edit-form-${id}`).style.display = 'block';
        } else {
            document.querySelector(`#edit-form-${item.id}`).style.display = 'none';
        }
    });
}

async function saveEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value.trim();
    const newDesc = document.getElementById(`edit-desc-${id}`).value.trim();
    const newPrice = parseFloat(document.getElementById(`edit-price-${id}`).value);

    if (!newName || isNaN(newPrice) || newPrice <= 0) {
        alert('Пожалуйста, заполните все поля корректно.');
        return;
    }

    const updatedItemData = { name: newName, description: newDesc, price: newPrice };
    const updatedItem = await updateMenuItemOnAPI(id, updatedItemData);

    if (updatedItem) {
        const index = menuItems.findIndex(item => item.id === id);
        if (index !== -1) {
            menuItems[index] = updatedItem;
        }
        renderMenuList();
    }
}

function cancelEdit(id) {
    document.querySelector(`#edit-form-${id}`).style.display = 'none';
}

async function deleteItem(id) {
    if (confirm('Вы уверены, что хотите удалить эту позицию?')) {
        const result = await deleteMenuItemFromAPI(id);

        if (result) {
            menuItems = menuItems.filter(item => item.id !== id);
            renderMenuList();
        }
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    window.location.href = 'admin-login.html';
}

loadMenuItems();