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
-- ТАБЛИЦА: orders (Заказы)
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('в ожидании', 'подтверждено', 'готовится', 'готов', 'завершено', 'отменено') DEFAULT 'в ожидании',
    payment_method ENUM('наличные', 'банковской картой', 'онлайн') DEFAULT 'наличные',
    delivery_address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: order_items (Состав заказа)
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL COMMENT 'Цена на момент заказа',
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_menu_item_id (menu_item_id)
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
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Примеры позиций меню
INSERT INTO menu_items (name, description, price, category, is_active) VALUES
('Фильтр-кофе (Ethiopia Yirgacheffe)', 'Жасмин, бергамот, сладкий лимон. Яркая кислотность.', 280.00, 'Классика и Авторские напитки', TRUE),
('Флэт Уайт', 'Двойной шот эспрессо и бархатистое молоко.', 320.00, 'Классика и Авторские напитки', TRUE),
('Лавандовый Раф', 'Нежные сливки, эспрессо, домашний сироп из цветов лаванды.', 380.00, 'Классика и Авторские напитки', TRUE),
('Фисташковый чизкейк', 'Сливочный сыр, дробленые фисташки, песочная основа.', 450.00, 'Десерты', TRUE),
('Айс Латте', 'Холодный латте с молоком и льдом.', 350.00, 'Холодные напитки', TRUE),
('Зелёный чай Matcha', 'Японский порошковый чай, взбитый с молоком.', 400.00, 'Чай и Альтернатива', TRUE);

-- ============================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS) ДЛЯ УДОБСТВА
-- ============================================

-- Представление: Активное меню с категориями
CREATE OR REPLACE VIEW v_active_menu AS
SELECT 
    id,
    category,
    name,
    description,
    price,
    created_at
FROM menu_items
WHERE is_active = TRUE
ORDER BY category, id ASC;

-- Представление: Статистика заказов
CREATE OR REPLACE VIEW v_order_stats AS
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- ============================================
-- ХРАНИМЫЕ ПРОЦЕДУРЫ
-- ============================================

-- Процедура: Создание нового заказа
DELIMITER //
CREATE PROCEDURE sp_create_order(
    IN p_user_id INT,
    IN p_payment_method VARCHAR(20),
    IN p_delivery_address TEXT,
    IN p_phone VARCHAR(20)
)
BEGIN
    INSERT INTO orders (user_id, payment_method, delivery_address, phone, status)
    VALUES (p_user_id, p_payment_method, p_delivery_address, p_phone, 'pending');
    
    SELECT LAST_INSERT_ID() as order_id;
END //
DELIMITER ;

-- Процедура: Добавление позиции в заказ
DELIMITER //
CREATE PROCEDURE sp_add_order_item(
    IN p_order_id INT,
    IN p_menu_item_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE item_price DECIMAL(10,2);
    
    SELECT price INTO item_price FROM menu_items WHERE id = p_menu_item_id;
    
    INSERT INTO order_items (order_id, menu_item_id, quantity, price)
    VALUES (p_order_id, p_menu_item_id, p_quantity, item_price);
    
    UPDATE orders 
    SET total_amount = (SELECT SUM(quantity * price) FROM order_items WHERE order_id = p_order_id)
    WHERE id = p_order_id;
END //
DELIMITER ;

-- ============================================
-- ТРИГГЕРЫ
-- ============================================

-- Триггер: Автоматическое обновление суммы заказа
DELIMITER //
CREATE TRIGGER tr_update_order_total
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (SELECT SUM(quantity * price) FROM order_items WHERE order_id = NEW.order_id)
    WHERE id = NEW.order_id;
END //
DELIMITER ;

-- ============================================
-- ПРОВЕРКА СОЗДАНИЯ
-- ============================================

SELECT '✅ База данных beans_brew_db успешно создана!' as status;
SELECT COUNT(*) as admins_count FROM admins;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as menu_items_count FROM menu_items;
SHOW TABLES;