const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'v01d0Fsp1r1t',
    database: 'beans_brew_db'
};

const BACKUP_DIR = path.join(__dirname, '../backups');

// Интерфейс для ввода
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Получить список доступных бэкапов
function getAvailableBackups() {
    try {
        return fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort()
            .reverse();
    } catch (error) {
        return [];
    }
}

// Функция восстановления
function restoreBackup(backupFile) {
    return new Promise((resolve, reject) => {
        const backupPath = path.join(BACKUP_DIR, backupFile);
        
        if (!fs.existsSync(backupPath)) {
            reject(new Error(`Файл не найден: ${backupPath}`));
            return;
        }
        
        console.log('\n🔄 Начало восстановления...');
        console.log('📄 Файл:', backupFile);
        console.log('📊 База данных:', DB_CONFIG.database);
        
        // Сначала удаляем существующую БД и создаём заново
        const dropCommand = `mysql -h ${DB_CONFIG.host} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} -e "DROP DATABASE IF EXISTS ${DB_CONFIG.database}; CREATE DATABASE ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`;
        
        exec(dropCommand, (error) => {
            if (error) {
                reject(error);
                return;
            }
            
            // Восстанавливаем из бэкапа
            const restoreCommand = `mysql -h ${DB_CONFIG.host} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} < "${backupPath}"`;
            
            exec(restoreCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Ошибка восстановления:', error.message);
                    reject(error);
                    return;
                }
                
                console.log('\n✅ База данных успешно восстановлена!');
                resolve();
            });
        });
    });
}

// Проверка данных после восстановления
async function verifyData() {
    const mysql = require('mysql2/promise');
    
    const pool = mysql.createPool({
        host: DB_CONFIG.host,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password,
        database: DB_CONFIG.database
    });
    
    try {
        console.log('\n🔍 Проверка целостности данных...');
        
        // Проверка таблиц
        const [tables] = await pool.query('SHOW TABLES');
        console.log('📊 Таблицы:', tables.length);
        tables.forEach(t => {
            console.log('   -', Object.values(t)[0]);
        });
        
        // Проверка админов
        const [admins] = await pool.query('SELECT COUNT(*) as count FROM admins');
        console.log('👥 Администраторов:', admins[0].count);
        
        // Проверка пользователей
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('👥 Пользователей:', users[0].count);
        
        // Проверка меню
        const [menu] = await pool.query('SELECT COUNT(*) as count FROM menu_items');
        console.log('🍽️ Позиций меню:', menu[0].count);
        
        console.log('\n✅ Все данные проверены успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка проверки:', error.message);
    } finally {
        await pool.end();
    }
}

// Основная функция
async function main() {
    const backups = getAvailableBackups();
    
    if (backups.length === 0) {
        console.log('❌ Нет доступных бэкапов для восстановления!');
        console.log('   Сначала создайте бэкап: node scripts/backup-database.js');
        process.exit(1);
    }
    
    console.log('\n📦 Доступные бэкапы:\n');
    backups.forEach((f, i) => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filePath);
        console.log(`   ${i + 1}. ${f} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    
    rl.question('\nВыберите номер бэкапа для восстановления (1-' + backups.length + '): ', async (answer) => {
        const index = parseInt(answer) - 1;
        
        if (isNaN(index) || index < 0 || index >= backups.length) {
            console.log('❌ Неверный номер');
            rl.close();
            process.exit(1);
        }
        
        const selectedBackup = backups[index];
        
        rl.question('⚠️  Текущие данные будут перезаписаны! Продолжить? (y/n): ', async (confirm) => {
            if (confirm.toLowerCase() !== 'y') {
                console.log('❌ Восстановление отменено');
                rl.close();
                process.exit(0);
            }
            
            try {
                await restoreBackup(selectedBackup);
                await verifyData();
            } catch (error) {
                console.error('❌ Ошибка:', error.message);
            } finally {
                rl.close();
            }
        });
    });
}

if (require.main === module) {
    main();
}

module.exports = { restoreBackup, verifyData };