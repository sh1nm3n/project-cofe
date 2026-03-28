const { body, validationResult } = require('express-validator');

exports.validateInput = [
    body('username')
        .trim()
        .notEmpty().withMessage('Имя пользователя обязательно')
        .isLength({ min: 3, max: 50 }).withMessage('От 3 до 50 символов')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Только буквы, цифры и _'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email обязателен')
        .isEmail().withMessage('Некорректный email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Пароль обязателен')
        .isLength({ min: 6 }).withMessage('Минимум 6 символов'),
    
    body('login_username').optional().trim().notEmpty(),
    body('login_password').optional().trim().notEmpty()
];

exports.handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Ошибка валидации',
            details: errors.array().map(e => e.msg)
        });
    }
    next();
};