import { Router } from "express";
import { query } from "./db.js";
import dns from "dns/promises";


const router = Router();


// Small helper to wrap route handlers and forward errors
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


/** Healthcheck */
router.get("/health", wrap(async (_req, res) => {
await query("SELECT 1");
res.json({ ok: true });
}));

/** Domain check  (Optional) */
 router.post("/test_domain", wrap(async (req, res) => {
  const { email = "" } = req.body ?? {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'email'" });
  }

  const domain = email.split("@")[1];
  if (!domain) {
    return res.status(400).json({ error: "Email must contain a domain" });
  }

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return res.status(400).json({ valid: false, error: "Domain has no MX records" });
    }

    // ok, MX records exist
    return res.status(200).json({ valid: true, domain, mx: records });

  } catch (err) {
    console.error("MX check failed:", err);
    return res.status(400).json({ valid: false, error: "Invalid or unreachable email domain" });
  }
}));

/** USERS */
router.post("/users", wrap(async (req, res) => {
const { display_name = "", email } = req.body ?? {};
if (!email) return res.status(400).json({ error: "Missing 'email'" });


const { rows } = await query(
`INSERT INTO users (email, display_name)
VALUES ($1, $2)
ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
RETURNING id, email, display_name, created_at`,
[email, display_name]
);
res.status(201).json(rows[0]);
}));


/** POSITIONS (for one user -> many positions) */
router.get("/positions", wrap(async (req, res) => {
const { user_id } = req.query;
const sql = user_id
? `SELECT * FROM positions WHERE user_id = $1 ORDER BY created_at DESC`
: `SELECT * FROM positions ORDER BY created_at DESC`;
const params = user_id ? [user_id] : [];
const { rows } = await query(sql, params);
res.json(rows);
}));

// Create a new position
router.post("/positions", wrap(async (req, res) => {
const { user_id, company_name, position_title, belief = "", status = "draft" } = req.body ?? {};
if (!user_id || !company_name || !position_title) {
return res.status(400).json({ error: "Missing 'user_id' | 'company_name' | 'position_title'" });
}
const { rows } = await query(
`INSERT INTO positions (user_id, company_name, position_title, belief, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, company_name, position_title, belief, status, created_at`,
[user_id, company_name, position_title, belief, status]
);
res.status(201).json(rows[0]);
}));

// Delete a position by ID
router.delete("/positions/:id", wrap(async (req, res) => {
const { id } = req.params;
const { rowCount } = await query(`DELETE FROM positions WHERE id = $1`, [id]);
if (!rowCount) return res.status(404).json({ error: "Position not found" });
res.status(204).send();
}));

export default router;