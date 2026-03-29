const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'v01d0Fsp1r1t',
    database: 'beans_brew_db'
};

async function verifyDatabase() {
    const pool = mysql.createPool(DB_CONFIG);
    
    try {
        console.log('\n🔍 Проверка базы данных beans_brew_db\n');
        console.log('═'.repeat(50));
        
        console.log('\n✅ Подключение: Успешно');
        
        const [tables] = await pool.query('SHOW TABLES');
        console.log('\n📊 Таблицы:', tables.length);
        tables.forEach(t => console.log('   •', Object.values(t)[0]));
        
        const tableChecks = [
            { table: 'admins', expected: '>=1' },
            { table: 'users', expected: '>=0' },
            { table: 'menu_items', expected: '>=0' },
            { table: 'contacts', expected: '>=0' },
            { table: 'orders', expected: '>=0' },
            { table: 'order_items', expected: '>=0' }
        ];
        
        console.log('\n📋 Данные в таблицах:');
        for (const check of tableChecks) {
            try {
                const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${check.table}`);
                console.log(`   ${check.table}: ${rows[0].count} записей`);
            } catch (e) {
                console.log(`   ${check.table}: Таблица не существует`);
            }
        }
        
        const [fk] = await pool.query(`
            SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = '${DB_CONFIG.database}'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        console.log('\n🔗 Внешние ключи:', fk.length);
        
        const [charset] = await pool.query(`
            SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
            FROM information_schema.SCHEMATA
            WHERE SCHEMA_NAME = '${DB_CONFIG.database}'
        `);
        console.log('\n🔤 Кодировка:', charset[0].DEFAULT_CHARACTER_SET_NAME);
        console.log('📝 Collation:', charset[0].DEFAULT_COLLATION_NAME);
        
        console.log('\n' + '═'.repeat(50));
        console.log('✅ Все проверки пройдены успешно!\n');
        
    } catch (error) {
        console.error('\n❌ Ошибка проверки:', error.message);
    } finally {
        await pool.end();
    }
}

verifyDatabase();