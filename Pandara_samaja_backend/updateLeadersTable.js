const pool = require('./config/db');

async function updateLeadersTable() {
    try {
        await pool.query(`
            ALTER TABLE leaders 
            ADD COLUMN IF NOT EXISTS name_or VARCHAR(255),
            ADD COLUMN IF NOT EXISTS role_or VARCHAR(255);
        `);
        console.log("Successfully added Odia columns to 'leaders' table.");
    } catch (err) {
        console.error("Error updating table:", err);
    } finally {
        pool.end();
    }
}

updateLeadersTable();
