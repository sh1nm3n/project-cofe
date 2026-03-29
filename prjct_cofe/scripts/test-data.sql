USE beans_brew_db;

-- Тестовые пользователи
INSERT INTO users (username, email, password_hash, role) VALUES
('testuser', 'test@email.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'user'),
('john', 'john@email.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'user');

-- Тестовые контакты
INSERT INTO contacts (name, email, phone, message) VALUES
('Иван Петров', 'ivan@email.com', '+79991234567', 'Хочу заказать кофе на мероприятие'),
('Анна Сидорова', 'anna@email.com', '+79997654321', 'Есть ли у вас веганские десерты?');

-- Проверка
SELECT * FROM users;
SELECT * FROM contacts;