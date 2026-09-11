const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false,
    })
  : null;

const db = {
  async execute(sql, params = []) {
    if (!pool) return [];
    let pgSql = sql;
    let index = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${index++}`);
    }
    try {
      const { rows } = await pool.query(pgSql, params);
      return rows;
    } catch (error) {
      console.error('Erro na query:', error);
      throw error;
    }
  },
  async fetch(sql, params = []) {
    const rows = await this.execute(sql, params);
    return rows[0] || null;
  },
  async fetchAll(sql, params = []) {
    return await this.execute(sql, params);
  },
};

module.exports = db;