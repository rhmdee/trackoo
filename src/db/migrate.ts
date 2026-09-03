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

  const createTransactionsTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(telegram_id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('EXPENSE', 'INCOME', 'DEBT', 'RECEIVABLE')),
      category VARCHAR(100),
      counterparty VARCHAR(255),
      description TEXT,
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await query(createUsersTableQuery);
    console.log("✅ Tabel 'users' siap.");

    await query(createTransactionsTableQuery);
    console.log("✅ Tabel 'transactions' siap.");

    // Membuat tabel installments
    const createInstallmentsTable = `
      CREATE TABLE IF NOT EXISTS installments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
        counterparty VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        monthly_amount DECIMAL(15, 2) NOT NULL,
        tenor INT NOT NULL,
        paid_count INT DEFAULT 0,
        due_date INT, -- Tanggal jatuh tempo tiap bulan (1-31)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE atau COMPLETED
      );
    `;
    await query(createInstallmentsTable);
    console.log("✅ Tabel 'installments' siap.");

  } catch (err) {
    console.error("❌ Gagal membuat tabel:", err);
  } finally {
    process.exit();
  }
}

createTables();
