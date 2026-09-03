import { query } from './index';

async function createTables() {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      telegram_id VARCHAR(255) PRIMARY KEY,
      first_name VARCHAR(255),
      username VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await query(createUsersTableQuery);
    console.log("✅ Tabel 'users' berhasil dibuat/sudah ada.");
  } catch (err) {
    console.error("❌ Gagal membuat tabel:", err);
  } finally {
    process.exit();
  }
}

createTables();
