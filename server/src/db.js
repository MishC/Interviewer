// src/db.js
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(" Missing DATABASE_URL in environment");
}

// Enable SSL only when PGSSL=true (e.g., cloud Postgres)
const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false;

export const pool = new Pool({
  connectionString,
  ssl,
  max: 10,                     // max pooled connections
  idleTimeoutMillis: 30_000,   // close idle clients after 30s
  connectionTimeoutMillis: 10_000, // fail fast if DB unreachable
  application_name: "interviewer-server",
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (process.env.NODE_ENV !== "production") {
      const duration = Date.now() - start;
      console.log("SQL:", { text, duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("DB ERROR:", err.message);
    }
    throw err;
  }
}

export async function healthcheck() {
  const r = await query("SELECT 1 as ok");
  return r.rows[0]?.ok === 1;
}

export async function closePool() {
  await pool.end();
}

// Optional: test connection on boot (comment out if you don’t want it)
(async () => {
  try {
    await query("SELECT now()");
    console.log(" Connected to PostgreSQL");
  } catch (e) {
    console.error("PostgreSQL connection failed:", e.message);
  }
})();
