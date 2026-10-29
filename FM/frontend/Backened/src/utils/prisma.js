'use strict';

const path = require('path');
const { fileURLToPath } = require('url');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

function resolveDatabasePath() {
  const raw = process.env.DATABASE_URL || 'file:./data/flooring_junction.db';

  if (raw.startsWith('file:')) {
    const filePath = raw.replace(/^file:/, '');
    return path.isAbsolute(filePath) ? filePath : path.resolve(__dirname, '..', '..', filePath);
  }

  return path.isAbsolute(raw) ? raw : path.resolve(__dirname, '..', '..', raw);
}

const sqliteDatabase = new Database(resolveDatabasePath());
const adapter = new PrismaBetterSqlite3(sqliteDatabase);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
