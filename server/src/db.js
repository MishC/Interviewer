import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
 


const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
console.error("Missing DATABASE_URL in environment");
}


// Optional SSL (for cloud DBs like Render/Neon/Railway). Set PGSSL=true to enable.
const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false;


export const pool = new Pool({
connectionString,
ssl,
max: 10, // connection pool size
idleTimeoutMillis: 30_000,
});


export async function query(text, params) {
const start = Date.now();
try {
const res = await pool.query(text, params);
const duration = Date.now() - start;
if (process.env.NODE_ENV !== "production") {
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
return r.rows[0].ok === 1;
}


// Graceful shutdown helper (optional)
export async function closePool() {
await pool.end();
}

