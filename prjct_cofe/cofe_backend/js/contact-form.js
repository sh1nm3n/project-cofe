const API_URL = 'http://localhost:3000/api';

// === ОТПРАВКА ФОРМЫ ===
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 🔧 Останавливаем стандартную отправку!
            
            console.log('📤 Начало отправки формы...');
            
            // Получаем данные из формы
            const formData = {
                name: document.getElementById('contactName').value.trim(),
                email: document.getElementById('contactEmail').value.trim(),
                phone: document.getElementById('contactPhone').value.trim(),
                message: document.getElementById('contactMessage').value.trim()
            };

            console.log('📦 Данные формы:', formData);

            // Блокируем кнопку
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
            formMessage.style.display = 'none';

            try {
                console.log('📡 Отправка запроса на:', `${API_URL}/contact`);
                
                const response = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'  // 🔧 Обязательно!
                    },
                    body: JSON.stringify(formData)
                });

                console.log('📥 Статус ответа:', response.status);

                const data = await response.json();
                console.log('📥 Ответ сервера:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Ошибка отправки');
                }

                // Успех
                formMessage.textContent = '✅ ' + data.message;
                formMessage.style.background = 'rgba(76, 175, 80, 0.2)';
                formMessage.style.color = '#4caf50';
                formMessage.style.display = 'block';

                // Очищаем форму
                contactForm.reset();

                console.log('✅ Сообщение отправлено успешно!');

            } catch (error) {
                console.error('❌ Ошибка:', error);
                
                // Ошибка
                formMessage.textContent = '❌ ' + error.message;
                formMessage.style.background = 'rgba(244, 67, 54, 0.2)';
                formMessage.style.color = '#f44336';
                formMessage.style.display = 'block';
            } finally {
                // Разблокируем кнопку
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить';

                // Скрываем сообщение через 5 секунд
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }
        });
    }

    // Проверка статуса пользователя
    checkUserStatus();
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