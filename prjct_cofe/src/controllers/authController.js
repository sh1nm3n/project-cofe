const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// ✅ РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Валидация
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
        }
        
        // Проверка существования пользователя
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Пользователь с таким именем или email уже существует' });
        }
        
        // Хеширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Сохранение в БД
        const [result] = await db.query(
            'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
            [username, passwordHash, 'user', email]
        );
        
        console.log(`✅ Пользователь зарегистрирован: ${username} (ID: ${result.insertId})`);
        
        res.status(201).json({
            message: 'Регистрация успешна',
            user: { id: result.insertId, username, email, role: 'user' }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
};

// ✅ ВХОД ПОЛЬЗОВАТЕЛЯ
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }
        
        // Поиск пользователя
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Неверные учётные данные' });
        }
        
        const user = users[0];
        
        // Проверка пароля
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Неверные учётные данные' });
        }
        
        // Генерация токена
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        console.log(`✅ Вход выполнен: ${user.username}`);
        
        res.json({
            message: 'Успешный вход',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
};

// ✅ ПРОВЕРКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
exports.getMe = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ user: decoded });
        
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(403).json({ error: 'Недействительный токен' });
    }
};

// ✅ ВЫХОД
exports.logout = (req, res) => {
    res.json({ message: 'Выход выполнен' });
};