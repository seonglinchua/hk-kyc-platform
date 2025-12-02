import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  console.log('🔧 Initializing database...');

  const dbPath = join(__dirname, '../../prisma/dev.db');
  const db = new Database(dbPath);

  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create User table
    db.exec(`
      CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create Case table
    db.exec(`
      CREATE TABLE IF NOT EXISTS "Case" (
        id TEXT PRIMARY KEY,
        caseNumber TEXT UNIQUE NOT NULL,
        clientType TEXT NOT NULL,
        clientName TEXT NOT NULL,
        dateOfBirth DATETIME,
        dateOfIncorporation DATETIME,
        country TEXT NOT NULL,
        nationality TEXT,
        businessType TEXT,
        industry TEXT,
        sourceOfWealth TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        riskScore INTEGER,
        rmId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        approvedAt DATETIME,
        rejectedAt DATETIME,
        approvedBy TEXT,
        rejectedBy TEXT,
        FOREIGN KEY (rmId) REFERENCES User(id)
      );
    `);

    // Create Document table
    db.exec(`
      CREATE TABLE IF NOT EXISTS Document (
        id TEXT PRIMARY KEY,
        documentType TEXT NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        mimeType TEXT NOT NULL,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        caseId TEXT NOT NULL,
        FOREIGN KEY (caseId) REFERENCES "Case"(id) ON DELETE CASCADE
      );
    `);

    // Create AISummary table
    db.exec(`
      CREATE TABLE IF NOT EXISTS AISummary (
        id TEXT PRIMARY KEY,
        riskScore INTEGER NOT NULL,
        summary TEXT NOT NULL,
        redFlags TEXT NOT NULL,
        missingInfo TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        processedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        processingTime INTEGER,
        modelUsed TEXT,
        caseId TEXT UNIQUE NOT NULL,
        FOREIGN KEY (caseId) REFERENCES "Case"(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS Case_status_idx ON "Case"(status);
      CREATE INDEX IF NOT EXISTS Case_rmId_idx ON "Case"(rmId);
      CREATE INDEX IF NOT EXISTS Case_createdAt_idx ON "Case"(createdAt);
      CREATE INDEX IF NOT EXISTS Document_caseId_idx ON Document(caseId);
      CREATE INDEX IF NOT EXISTS Document_documentType_idx ON Document(documentType);
      CREATE INDEX IF NOT EXISTS AISummary_caseId_idx ON AISummary(caseId);
    `);

    console.log('✅ Database schema created');

    // Seed admin user
    const hashedPassword = await bcrypt.hash('password', 10);
    const adminId = 'admin-' + Date.now();
    const rmId = 'rm-' + Date.now();

    try {
      const insertAdmin = db.prepare(`
        INSERT INTO User (id, email, username, password, name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertAdmin.run(adminId, 'admin@example.com', 'admin', hashedPassword, 'Admin User', 'admin');
      console.log('✅ Created admin user: admin@example.com');

      const insertRM = db.prepare(`
        INSERT INTO User (id, email, username, password, name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertRM.run(rmId, 'rm@example.com', 'rmuser', hashedPassword, 'Relationship Manager', 'user');
      console.log('✅ Created RM user: rm@example.com');

      console.log('\n🎉 Database initialization completed!');
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@example.com');
      console.log('   Password: password');
      console.log('\n   Email: rm@example.com');
      console.log('   Password: password');
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        console.log('ℹ️  Users already exist, skipping seed');
      } else {
        throw err;
      }
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    db.close();
  }
}

initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
