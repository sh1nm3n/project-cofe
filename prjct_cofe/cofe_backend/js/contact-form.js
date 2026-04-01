const API_URL = 'http://localhost:3000/api';

const phoneInput = document.getElementById('contactPhone');

if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d+]/g, '');
        
        if (value.length > 0 && value[0] !== '+') {
            value = '+' + value;
        }
        
        if (value.length > 12) {
            value = value.slice(0, 12);
        }
        
        e.target.value = value;
    });

    phoneInput.addEventListener('blur', (e) => {
        if (e.target.value === '+') {
            e.target.value = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            console.log('📤 Начало отправки формы...');
            
            const formData = {
                name: document.getElementById('contactName').value.trim(),
                email: document.getElementById('contactEmail').value.trim(),
                phone: document.getElementById('contactPhone').value.trim(),
                message: document.getElementById('contactMessage').value.trim()
            };

            console.log('📦 Данные формы:', formData);

            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
            formMessage.style.display = 'none';

            try {
                console.log('📡 Отправка запроса на:', `${API_URL}/contact`);
                
                const response = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(formData)
                });

                console.log('📥 Статус ответа:', response.status);

                const data = await response.json();
                console.log('📥 Ответ сервера:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Ошибка отправки');
                }

                formMessage.textContent = '✅ ' + data.message;
                formMessage.style.background = 'rgba(76, 175, 80, 0.2)';
                formMessage.style.color = '#4caf50';
                formMessage.style.display = 'block';

                contactForm.reset();

                console.log('✅ Сообщение отправлено успешно!');

            } catch (error) {
                console.error('❌ Ошибка:', error);
                
                formMessage.textContent = '❌ ' + error.message;
                formMessage.style.background = 'rgba(244, 67, 54, 0.2)';
                formMessage.style.color = '#f44336';
                formMessage.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить';

                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }
        });
    }

    checkUserStatus();
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