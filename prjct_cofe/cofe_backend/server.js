const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// === ПУЛ ПОДКЛЮЧЕНИЙ ===
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'v01d0Fsp1r1t',
    database: 'beans_brew_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// === ПРОВЕРКА ПОДКЛЮЧЕНИЯ ===
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ База данных подключена: beans_brew_db');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error.message);
        return false;
    }
}

// === ИНИЦИАЛИЗАЦИЯ СЕССИЙ ===
global.adminSessions = {};

// === АУТЕНТИФИКАЦИЯ ===
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔐 Проверка токена:', token ? token.substring(0, 20) + '...' : 'НЕТ ТОКЕНА');
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    try {
        if (token.length !== 64) { 
            return res.status(403).json({ error: 'Недействительный токен' });
        }

        const sessions = global.adminSessions || {};
        const validSession = Object.entries(sessions).find(([storedToken]) => storedToken === token);
        
        if (!validSession) {
            console.log('❌ Сессия не найдена. Доступные сессии:', Object.keys(sessions).length);
            return res.status(403).json({ error: 'Сессия истекла или недействительна' });
        }

        req.user = { username: validSession[1].username, role: 'admin' };
        console.log('✅ Токен действителен для:', req.user.username);
        next();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

// === ВХОД АДМИНА ===
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('📥 Login request:', { username, password: '***' });
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    try {
        const connection = await pool.getConnection();
        const query = 'SELECT * FROM admins WHERE username = ?';
        const [rows] = await connection.execute(query, [username]);
        connection.release();

        console.log('📊 Найдено записей:', rows.length);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const admin = rows[0];
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        console.log('🔑 Введён хеш:', hashedPassword);
        console.log('🔑 Хеш в БД:', admin.password_hash);

        if (hashedPassword !== admin.password_hash) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        global.adminSessions[sessionToken] = { 
            username: admin.username, 
            role: 'admin',
            createdAt: Date.now() 
        };

        console.log('✅ Админ вошёл:', admin.username);
        console.log('🎫 Токен:', sessionToken.substring(0, 20) + '...');
        console.log('📋 Активные сессии:', Object.keys(global.adminSessions).length);

        res.json({ 
            success: true, 
            token: sessionToken, 
            username: admin.username,
            role: 'admin'
        });

    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// === РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ===
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body; 
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    try {
        const connection = await pool.getConnection();
        
        const checkQuery = 'SELECT id FROM users WHERE username = ?';
        const [existing] = await connection.execute(checkQuery, [username]);
        
        if (existing.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        const insertQuery = 'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(insertQuery, [
            username, 
            hashedPassword, 
            'user',
            email || ''
        ]);
        
        connection.release();

        console.log(`✅ Пользователь зарегистрирован: ${username} (ID: ${result.insertId})`);
        
        res.status(201).json({
            message: 'Регистрация успешна',
            user: { id: result.insertId, username, role: 'user' }
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// === РЕГИСТРАЦИЯ (альтернативный URL для совместимости) ===
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;  // ← Добавлено email
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    try {
        const connection = await pool.getConnection();
        const checkQuery = 'SELECT id FROM users WHERE username = ?';
        const [existing] = await connection.execute(checkQuery, [username]);
        
        if (existing.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'Пользователь уже существует' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const insertQuery = 'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(insertQuery, [username, hashedPassword, 'user']);
        connection.release();

        res.status(201).json({ message: 'Регистрация успешна', user: { id: result.insertId, username } });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// === ПРОВЕРКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ===
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({ user: req.user, type: 'admin' });
});

// === ВЫХОД ===
app.post('/api/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token && global.adminSessions) {
        delete global.adminSessions[token];
        console.log('🚪 Админ вышел, сессия удалена');
    }
    
    res.json({ message: 'Выход выполнен' });
});

// === МЕНЮ (публичный доступ) ===
app.get('/api/menu', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const query = 'SELECT * FROM menu_items ORDER BY id ASC';
        const [results] = await connection.execute(query);
        connection.release();
        res.json(results);
    } catch (error) {
        console.error('❌ Ошибка при получении меню:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных' });
    }
});

// === ДОБАВИТЬ В МЕНЮ (только админ) ===
app.post('/api/menu', authenticateToken, async (req, res) => {
    const { name, description, price, category } = req.body;
    
    console.log('📥 Добавление товара:', { name, price, category });
    
    if (!name || price === undefined || price === null || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Название и цена обязательны.' });
    }

    try {
        const connection = await pool.getConnection();
        const query = 'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(query, [name, description || '', parseFloat(price), category || '']);
        connection.release();

        console.log('✅ Товар добавлен, ID:', result.insertId);
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            description: description || '', 
            price: parseFloat(price),
            category: category || ''
        });
    } catch (error) {
        console.error('❌ Ошибка при добавлении позиции:', error);
        console.error('   SQL Error:', error.message);
        console.error('   SQL Code:', error.code);
        res.status(500).json({ error: 'Ошибка сервера при добавлении данных: ' + error.message });
    }
});

// === ОБНОВИТЬ В МЕНЮ (только админ) ===
app.put('/api/menu/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { name, description, price, category } = req.body;
    
    if (!name || price === undefined || price === null || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Название и цена обязательны.' });
    }

    try {
        const connection = await pool.getConnection();
        const query = 'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ? WHERE id = ?';
        const [result] = await connection.execute(query, [name, description || '', parseFloat(price), category || '', id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Позиция меню не найдена.' });
        }
        res.json({ message: 'Позиция обновлена успешно', id, name, description: description || '', price: parseFloat(price) });
    } catch (error) {
        console.error('❌ Ошибка при обновлении позиции:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении данных' });
    }
});

// === УДАЛИТЬ ИЗ МЕНЮ (только админ) ===
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    
    try {
        const connection = await pool.getConnection();
        const query = 'DELETE FROM menu_items WHERE id = ?';
        const [result] = await connection.execute(query, [id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Позиция меню не найдена.' });
        }
        res.json({ message: 'Позиция удалена успешно', id });
    } catch (error) {
        console.error('❌ Ошибка при удалении позиции:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении данных' });
    }
});

// === ДОБАВИТЬ ПОСЛЕ СУЩЕСТВУЮЩИХ МАРШРУТОВ ===

// Маршруты под префиксом /api/auth/ (для совместимости)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;  // ← Добавлено email
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    try {
        const connection = await pool.getConnection();
        
        const checkQuery = 'SELECT id FROM users WHERE username = ?';
        const [existing] = await connection.execute(checkQuery, [username]);
        
        if (existing.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        const insertQuery = 'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(insertQuery, [
            username, 
            hashedPassword, 
            'user',
            email || ''
        ]);
        
        connection.release();

        console.log(`✅ Пользователь зарегистрирован: ${username} (ID: ${result.insertId})`);
        
        res.status(201).json({
            message: 'Регистрация успешна',
            user: { id: result.insertId, username, role: 'user' }
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// POST /api/auth/login - вход пользователя (не админа)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('📥 Вход пользователя:', { username, password: '***' });

    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    try {
        const connection = await pool.getConnection();
        
        // 🔧 Ищем по username ИЛИ email
        const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
        const [rows] = await connection.execute(query, [username, username]);

        console.log('📊 Найдено записей:', rows.length);  // ← Добавить для отладки
        if (rows.length > 0) {
            console.log('📋 Найден пользователь:', rows[0].username, rows[0].email);
        }

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = rows[0];
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (hashedPassword !== user.password_hash) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        if (!global.userSessions) global.userSessions = {};
        global.userSessions[sessionToken] = { 
            username: user.username, 
            role: user.role || 'user',
            createdAt: Date.now() 
        };

        console.log(`✅ Пользователь вошёл: ${user.username}`);
        res.json({ 
            success: true, 
            token: sessionToken, 
            username: user.username,
            role: user.role || 'user'
        });

    } catch (error) {
        console.error('Ошибка входа пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// === СТАТИЧЕСКИЕ ФАЙЛЫ ===
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-panel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

app.get('/menu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

// === ЗАПУСК СЕРВЕРА ===
async function startServer() {
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
        console.error('⚠️ Сервер запущен, но подключение к БД не удалось!');
    }
    
    app.listen(PORT, () => {
        console.log(`\nСервер запущен на http://localhost:${PORT}`);
    });
}

startServer();