const pool = require('./config/db');

async function addCol() {
    try {
        await pool.query('ALTER TABLE posts ADD COLUMN image_url VARCHAR(255);');
        console.log('Column added');
    } catch (err) {
        if (err.code === '42701') console.log('Column already exists');
        else console.error(err);
    } finally {
        pool.end();
    }
}
addCol();
