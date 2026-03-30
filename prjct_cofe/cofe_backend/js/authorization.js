const API_URL = window.location.origin + '/api';

    // ================= ТАБЫ =================
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = {
        login: document.getElementById('loginForm'),
        register: document.getElementById('registerForm'),
        userInfo: document.getElementById('userInfo')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            Object.values(forms).forEach(f => f.classList.remove('active'));
            forms[tab.dataset.tab].classList.add('active');
            
            clearMessages();
        });
    });

    // ================= УТИЛИТЫ =================
    function getToken() { return localStorage.getItem('user-token'); }
    function setToken(token) { localStorage.setItem('user-token', token); }
    function clearToken() { localStorage.removeItem('user-token'); }
    function getUser() { return JSON.parse(localStorage.getItem('user-data') || 'null'); }
    function setUser(user) { localStorage.setItem('user-data', JSON.stringify(user)); }
    function clearUser() { localStorage.removeItem('user-data'); }

    function showMessage(elementId, message, type) {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.className = 'message ' + type;
    }

    function clearMessages() {
        ['loginMessage', 'registerMessage'].forEach(id => {
            const el = document.getElementById(id);
            el.textContent = '';
            el.className = 'message';
        });
    }

    function setButtonLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        btn.disabled = loading;
        btn.textContent = loading ? 'Загрузка...' : (btnId === 'loginBtn' ? 'Войти' : 'Зарегистрироваться');
    }

    // ================= ПРОВЕРКА АВТОРИЗАЦИИ =================
    async function checkAuth() {
        const token = getToken();
        const user = getUser();
        
        if (token && user) {
            try {
                const res = await fetch('http://localhost:3000/api/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    showUserInfo(data.user);
                    return true;
            }
            } catch (e) {
                console.error('Auth check failed:', e);
            }
        }
        
        clearAuth();
        return false;
    }

    function showUserInfo(user) {
        Object.values(forms).forEach(f => f.classList.remove('active'));
        forms.userInfo.classList.add('active');
        
        document.getElementById('welcomeUser').textContent = `Добро пожаловать, ${user.username}!`;
        
        
        // Скрыть табы
        document.getElementById('authTabs').style.display = 'none';
    }

    function clearAuth() {
        clearToken();
        clearUser();
        document.getElementById('authTabs').style.display = 'flex';
        Object.values(forms).forEach(f => f.classList.remove('active'));
        forms.login.classList.add('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    }

    // ================= ВХОД =================
    forms.login.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        setButtonLoading('loginBtn', true);
        
        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Ошибка входа');
            }
            
            setToken(data.token);
            setUser({ username: data.username, role: data.role, email: data.email || '' });
            
            showMessage('loginMessage', '✅ Вход успешен!', 'success');
            setTimeout(() => showUserInfo(data), 500);
            
        } catch (error) {
            showMessage('loginMessage', '❌ ' + error.message, 'error');
        } finally {
            setButtonLoading('loginBtn', false);
        }
    });

    // ================= РЕГИСТРАЦИЯ =================
    forms.register.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        
        setButtonLoading('registerBtn', true);
        
        try {
            const res = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }
            
            showMessage('registerMessage', '✅ Регистрация успешна! Теперь войдите.', 'success');
            
            // Очистить форму и переключить на вход
            forms.register.reset();
            setTimeout(() => {
                tabs[0].click();
            }, 1500);
            
        } catch (error) {
            showMessage('registerMessage', '❌ ' + error.message, 'error');
        } finally {
            setButtonLoading('registerBtn', false);
        }
    });

    // ================= ВЫХОД =================
    function logout() {
    // Очищаем сессию
    clearToken();
    clearUser();
    
    // Отправляем запрос на сервер для удаления сессии
    fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    }).catch(() => {}); // Игнорируем ошибки
    
    // Перезагружаем страницу
    location.reload();
}

function goToMain() {
    window.location.href = 'index.html';
}

// ================= ИНИЦИАЛИЗАЦИЯ =================
window.addEventListener('load', () => {
    checkAuth();
});