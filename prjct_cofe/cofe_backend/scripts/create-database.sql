CREATE DATABASE IF NOT EXISTS beans_brew_db 

USE beans_brew_db;

-- ============================================
-- ТАБЛИЦА: admins (Администраторы)
-- ============================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: users (Пользователи)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'SHA256 хеш пароля',
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: menu_items (Позиции меню)
-- ============================================
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category text NOT NULL DEFAULT 'Классика и Авторские напитки',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_active (is_active),
    FULLTEXT INDEX ft_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- ТАБЛИЦА: contacts (Сообщения от клиентов)
-- ============================================
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Примеры позиций меню
INSERT INTO menu_items (name, description, price, category) VALUES
('Фильтр-кофе (Ethiopia Yirgacheffe)', 'Жасмин, бергамот, сладкий лимон. Яркая кислотность.', 280.00, 'Классика и Авторские напитки'),
('Флэт Уайт', 'Двойной шот эспрессо и бархатистое молоко.', 320.00, 'Классика и Авторские напитки'),
('Лавандовый Раф', 'Нежные сливки, эспрессо, домашний сироп из цветов лаванды.', 380.00, 'Классика и Авторские напитки'),
('Фисташковый чизкейк', 'Сливочный сыр, дробленые фисташки, песочная основа.', 450.00, 'Десерты'),
('Айс Латте', 'Холодный латте с молоком и льдом.', 350.00, 'Холодные напитки'),
('Зелёный чай Matcha', 'Японский порошковый чай, взбитый с молоком.', 400.00, 'Чай и Альтернатива');


-- ============================================
-- ПРОВЕРКА СОЗДАНИЯ
-- ============================================

SELECT '✅ База данных beans_brew_db успешно создана!' as status;
SELECT COUNT(*) as admins_count FROM admins;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as menu_items_count FROM menu_items;
SHOW TABLES;