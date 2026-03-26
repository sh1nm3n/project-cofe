function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const currentPage = window.location.pathname;
    
    if (!isLoggedIn && !currentPage.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
    
    if (isLoggedIn && currentPage.includes('admin-login.html')) {
        window.location.href = 'admin-dashboard.html';
    }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('loginError');
        
        // Demo credentials (replace with real authentication)
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', username);
            window.location.href = 'admin-dashboard.html';
        } else {
            errorElement.textContent = 'Неверный логин или пароль';
        }
    });
}

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'admin-login.html';
    });
}

const modal = document.getElementById('itemModal');
const addItemBtn = document.getElementById('addItemBtn');
const modalClose = document.querySelectorAll('.modal-close');
const itemForm = document.getElementById('itemForm');

if (addItemBtn) {
    addItemBtn.addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Добавить товар';
        itemForm.reset();
        modal.classList.add('active');
    });
}

modalClose.forEach(btn => {
    btn.addEventListener('click', function() {
        modal.classList.remove('active');
    });
});

if (modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

if (itemForm) {
    itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemData = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            price: document.getElementById('itemPrice').value,
            description: document.getElementById('itemDescription').value,
            status: document.getElementById('itemStatus').checked
        };
        
        console.log('Saving item:', itemData);
        
        alert('Товар успешно сохранён!');
        modal.classList.remove('active');
        
        location.reload();
    });
}

document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function() {
        const itemId = this.dataset.id;
        document.getElementById('modalTitle').textContent = 'Редактировать товар';
        modal.classList.add('active');
        console.log('Edit item:', itemId);
    });
});

document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function() {
        const itemId = this.dataset.id;
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            console.log('Delete item:', itemId);
            this.closest('tr').remove();
        }
    });
});

const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const menuItemsTable = document.getElementById('menuItemsTable');

if (categoryFilter && searchInput && menuItemsTable) {
    function filterItems() {
        const category = categoryFilter.value;
        const search = searchInput.value.toLowerCase();
        const rows = menuItemsTable.querySelectorAll('tr');
        
        rows.forEach(row => {
            const itemCategory = row.cells[1].textContent.toLowerCase();
            const itemName = row.cells[0].textContent.toLowerCase();
            
            const categoryMatch = category === 'all' || itemCategory.includes(category);
            const searchMatch = itemName.includes(search);
            
            row.style.display = categoryMatch && searchMatch ? '' : 'none';
        });
    }
    
    categoryFilter.addEventListener('change', filterItems);
    searchInput.addEventListener('input', filterItems);
}

const saveContactsBtn = document.getElementById('saveContactsBtn');
const contactForm = document.getElementById('contactForm');

if (saveContactsBtn && contactForm) {
    saveContactsBtn.addEventListener('click', function() {
        const contactData = {
            address: document.getElementById('address').value,
            hours: document.getElementById('hours').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };
        
        localStorage.setItem('contactInfo', JSON.stringify(contactData));
        
        alert('Контакты успешно сохранены!');
    });
}

document.querySelectorAll('.btn-reply').forEach(btn => {
    btn.addEventListener('click', function() {
        const messageItem = this.closest('.message-item');
        const author = messageItem.querySelector('.message-author').textContent;
        alert(`Открыть ответ для: ${author}`);
    });
});

document.querySelectorAll('.btn-archive').forEach(btn => {
    btn.addEventListener('click', function() {
        const messageItem = this.closest('.message-item');
        if (confirm('Переместить в архив?')) {
            messageItem.style.opacity = '0.5';
            messageItem.style.pointerEvents = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const savedContacts = localStorage.getItem('contactInfo');
    if (savedContacts) {
        const contacts = JSON.parse(savedContacts);
        if (document.getElementById('address')) {
            document.getElementById('address').value = contacts.address || '';
            document.getElementById('hours').value = contacts.hours || '';
            document.getElementById('phone').value = contacts.phone || '';
            document.getElementById('email').value = contacts.email || '';
        }
    }
});

const alerts = document.querySelectorAll('.alert');
alerts.forEach(alert => {
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
});