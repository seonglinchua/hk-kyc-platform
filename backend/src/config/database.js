import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../prisma/dev.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create a Prisma-like API wrapper
const prisma = {
  user: {
    findUnique: ({ where }) => {
      const stmt = db.prepare('SELECT * FROM User WHERE email = ? OR id = ?');
      return stmt.get(where.email || null, where.id || null) || null;
    },
    findFirst: ({ where }) => {
      if (where.OR) {
        const stmt = db.prepare('SELECT * FROM User WHERE email = ? OR username = ?');
        return stmt.get(where.OR[0].email, where.OR[1].username) || null;
      }
      return null;
    },
    create: ({ data, select }) => {
      const id = data.id || 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const stmt = db.prepare(`
        INSERT INTO User (id, email, username, password, name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, data.email, data.username, data.password, data.name, data.role || 'user');

      if (select) {
        return prisma.user.findUnique({ where: { id } });
      }
      return { id, ...data };
    },
    upsert: ({ where, update, create }) => {
      const existing = prisma.user.findUnique({ where });
      if (existing) {
        return existing;
      }
      return prisma.user.create({ data: create });
    }
  },
  case: {
    findMany: ({ where, include, orderBy, skip, take }) => {
      let query = 'SELECT * FROM "Case"';
      const params = [];

      if (where) {
        const conditions = [];
        if (where.status) {
          conditions.push('status = ?');
          params.push(where.status);
        }
        if (where.rmId) {
          conditions.push('rmId = ?');
          params.push(where.rmId);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      if (orderBy) {
        const orderField = Object.keys(orderBy)[0];
        const orderDir = orderBy[orderField];
        query += ` ORDER BY ${orderField} ${orderDir === 'desc' ? 'DESC' : 'ASC'}`;
      }

      if (take) {
        query += ` LIMIT ${take}`;
        if (skip) {
          query += ` OFFSET ${skip}`;
        }
      }

      const stmt = db.prepare(query);
      return stmt.all(...params);
    },
    findUnique: ({ where, include }) => {
      const stmt = db.prepare('SELECT * FROM "Case" WHERE id = ? OR caseNumber = ?');
      const result = stmt.get(where.id || null, where.caseNumber || null);

      if (result && include) {
        if (include.aiSummary) {
          const summaryStmt = db.prepare('SELECT * FROM AISummary WHERE caseId = ?');
          result.aiSummary = summaryStmt.get(result.id) || null;
        }
        if (include.documents) {
          const docsStmt = db.prepare('SELECT * FROM Document WHERE caseId = ?');
          result.documents = docsStmt.all(result.id);
        }
        if (include.relationshipManager) {
          const rmStmt = db.prepare('SELECT * FROM User WHERE id = ?');
          result.relationshipManager = rmStmt.get(result.rmId);
        }
      }

      return result || null;
    },
    findFirst: ({ where }) => {
      if (where.clientName) {
        const stmt = db.prepare('SELECT * FROM "Case" WHERE clientName = ?');
        return stmt.get(where.clientName) || null;
      }
      return null;
    },
    create: ({ data }) => {
      const id = 'case-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const caseNumber = data.caseNumber || 'C' + Date.now();

      const stmt = db.prepare(`
        INSERT INTO "Case" (
          id, caseNumber, clientType, clientName, dateOfBirth, dateOfIncorporation,
          country, nationality, businessType, industry, sourceOfWealth, status, riskScore, rmId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id, caseNumber, data.clientType, data.clientName,
        data.dateOfBirth ? data.dateOfBirth.toISOString() : null,
        data.dateOfIncorporation ? data.dateOfIncorporation.toISOString() : null,
        data.country, data.nationality, data.businessType, data.industry,
        data.sourceOfWealth, data.status || 'pending', data.riskScore || null, data.rmId
      );

      return prisma.case.findUnique({ where: { id } });
    },
    update: ({ where, data }) => {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          updates.push(`${key} = ?`);
          params.push(data[key]);
        }
      });

      params.push(where.id);

      const stmt = db.prepare(`
        UPDATE "Case" SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(...params);

      return prisma.case.findUnique({ where });
    },
    delete: ({ where }) => {
      const stmt = db.prepare('DELETE FROM "Case" WHERE id = ?');
      stmt.run(where.id);
      return { id: where.id };
    },
    count: ({ where }) => {
      let query = 'SELECT COUNT(*) as count FROM "Case"';
      const params = [];

      if (where) {
        const conditions = [];
        if (where.status) {
          conditions.push('status = ?');
          params.push(where.status);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const stmt = db.prepare(query);
      return stmt.get(...params).count;
    }
  },
  document: {
    findMany: ({ where }) => {
      const stmt = db.prepare('SELECT * FROM Document WHERE caseId = ? ORDER BY uploadedAt DESC');
      return stmt.all(where.caseId);
    },
    create: ({ data }) => {
      const id = 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

      const stmt = db.prepare(`
        INSERT INTO Document (id, documentType, fileName, filePath, fileSize, mimeType, caseId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id, data.documentType, data.fileName, data.filePath,
        data.fileSize, data.mimeType, data.caseId
      );

      return { id, ...data };
    },
    delete: ({ where }) => {
      const stmt = db.prepare('DELETE FROM Document WHERE id = ?');
      stmt.run(where.id);
      return { id: where.id };
    },
    findUnique: ({ where }) => {
      const stmt = db.prepare('SELECT * FROM Document WHERE id = ?');
      return stmt.get(where.id) || null;
    }
  },
  aiSummary: {
    create: ({ data }) => {
      const id = 'summary-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

      const stmt = db.prepare(`
        INSERT INTO AISummary (
          id, riskScore, summary, redFlags, missingInfo, recommendation,
          processingTime, modelUsed, caseId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id, data.riskScore, data.summary,
        JSON.stringify(data.redFlags || []),
        JSON.stringify(data.missingInfo || []),
        data.recommendation, data.processingTime, data.modelUsed, data.caseId
      );

      return { id, ...data };
    },
    findUnique: ({ where }) => {
      const stmt = db.prepare('SELECT * FROM AISummary WHERE caseId = ?');
      const result = stmt.get(where.caseId);

      if (result) {
        result.redFlags = JSON.parse(result.redFlags);
        result.missingInfo = JSON.parse(result.missingInfo);
      }

      return result || null;
    }
  },
  $connect: () => Promise.resolve(),
  $disconnect: () => {
    db.close();
    return Promise.resolve();
  }
};

console.log('✅ Database connected successfully');

// Graceful shutdown
process.on('beforeExit', () => {
  db.close();
});

export default prisma;
