const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'v01d0Fsp1r1t',
    database: 'beans_brew_db'
};

const BACKUP_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
    const filename = `beans_brew_backup_native_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.sql`;
    const backupPath = path.join(BACKUP_DIR, filename);
    
    console.log('\n🔄 Начало резервного копирования (Native Mode)...');
    
    const connection = await mysql.createConnection(DB_CONFIG);
    
    let sql = `-- Beans & Brew Database Backup\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;
    sql += `CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE ${DB_CONFIG.database};\n\n`;
    
    // Получаем список таблиц
    const [tables] = await connection.query('SHOW TABLES');
    
    for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0];
        console.log(`   📊 Таблица: ${tableName}`);
        
        // Структура таблицы
        const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
        sql += `\n-- Table structure for ${tableName}\n`;
        sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sql += `${createTable[0]['Create Table']};\n\n`;
        
        // Данные таблицы
        const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
        if (rows.length > 0) {
            sql += `-- Data for ${tableName}\n`;
            for (const row of rows) {
                const values = Object.values(row).map(v => 
                    typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : v
                );
                const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
                sql += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values.join(', ')});\n`;
            }
            sql += `\n`;
        }
    }
    
    await connection.end();
    
    fs.writeFileSync(backupPath, sql, 'utf8');
    
    const stats = fs.statSync(backupPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n✅ Бэкап успешно создан!');
    console.log('📄 Файл:', filename);
    console.log('📏 Размер:', sizeKB, 'KB');
    console.log('📁 Путь:', backupPath);
    
    return { filename, path: backupPath, size: sizeKB };
}

async function main() {
    try {
        await createBackup();
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }
}

module.exports = { createBackup };

if (require.main === module) {
    main();
}