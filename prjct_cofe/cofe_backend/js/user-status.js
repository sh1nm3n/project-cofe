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

document.addEventListener('DOMContentLoaded', checkUserStatus);