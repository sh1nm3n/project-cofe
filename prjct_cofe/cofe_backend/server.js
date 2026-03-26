// server.js
const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
    origin: [
        'http://127.0.0.1:5500' 
    ],
    credentials: true
}));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'v01d0Fsp1r1t', 
    database: 'beans_brew_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    try {
        if (token.length !== 64) { 
             return res.status(403).json({ error: 'Недействительный токен' });
        }

        const sessions = global.adminSessions || {};
        const validSession = Object.entries(sessions).find(([storedToken, userData]) => storedToken === token);
        if (!validSession) {
            return res.status(403).json({ error: 'Сессия истекла или недействительна' });
        }

        req.user = { username: validSession[1].username };
        next();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};


app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    try {
        const connection = await pool.getConnection();
        const query = 'SELECT * FROM admins WHERE username = ?';
        const [rows] = await connection.execute(query, [username]);
        connection.release();

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const admin = rows[0];
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (hashedPassword !== admin.password_hash) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Генерация токена сессии (упрощенная)
        const sessionToken = crypto.randomBytes(32).toString('hex');
        // Сохраняем сессию (в реальности используйте Redis или другое хранилище)
        if (!global.adminSessions) global.adminSessions = {};
        global.adminSessions[sessionToken] = { username: admin.username, createdAt: Date.now() };

        // Возвращаем токен
        res.json({ success: true, token: sessionToken, username: admin.username });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Маршрут для получения меню (теперь защищен)
app.get('/api/menu', authenticateToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const query = 'SELECT * FROM menu_items ORDER BY id ASC';
        const [results] = await connection.execute(query);
        connection.release();

        res.json(results);
    } catch (error) {
        console.error('Ошибка при получении меню:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных' });
    }
});

// Маршрут для добавления (защищен)
app.post('/api/menu', authenticateToken, async (req, res) => {
    const { name, description, price } = req.body;

    if (!name || price === undefined || price === null || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Название и цена обязательны.' });
    }

    try {
        const connection = await pool.getConnection();
        const query = 'INSERT INTO menu_items (name, description, price) VALUES (?, ?, ?)';
        const [result] = await connection.execute(query, [name, description, parseFloat(price)]);
        connection.release();

        res.status(201).json({ id: result.insertId, name, description, price: parseFloat(price) });
    } catch (error) {
        console.error('Ошибка при добавлении позиции:', error);
        res.status(500).json({ error: 'Ошибка сервера при добавлении данных' });
    }
});

// Маршрут для обновления (защищен)
app.put('/api/menu/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { name, description, price } = req.body;

    if (!name || price === undefined || price === null || isNaN(parseFloat(price))) {
        return res.status(400).json({ error: 'Название и цена обязательны.' });
    }

    try {
        const connection = await pool.getConnection();
        const query = 'UPDATE menu_items SET name = ?, description = ?, price = ? WHERE id = ?';
        const [result] = await connection.execute(query, [name, description, parseFloat(price), id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Позиция меню не найдена.' });
        }
        res.json({ message: 'Позиция обновлена успешно', id, name, description, price: parseFloat(price) });
    } catch (error) {
        console.error('Ошибка при обновлении позиции:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении данных' });
    }
});

// Маршрут для удаления (защищен)
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
        console.error('Ошибка при удалении позиции:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении данных' });
    }
});

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Сервер админ-панели запущен на http://localhost:${PORT}`);
});