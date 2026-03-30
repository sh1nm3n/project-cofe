document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', { // URL вашего сервера
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUsername', data.username);
            window.location.href = 'admin-panel.html';
        } else {
            document.getElementById('login-error').textContent = data.error || 'Ошибка входа.';
        }

        // 🔑 СОХРАНЯЕМ ТОКЕН!
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUsername', data.username);
        
        console.log('✅ Вход успешен. Токен:', data.token.substring(0, 20) + '...');
        
        window.location.href = 'admin-panel.html';
    } catch (error) {
        console.error("Ошибка запроса:", error);
        document.getElementById('login-error').textContent = 'Ошибка соединения с сервером.';
    }
});