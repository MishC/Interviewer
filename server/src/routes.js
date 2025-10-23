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
const { email, display_name=""} = req.body ?? {};
if (!email) return res.status(400).json({ error: "Missing 'email'" });
const { rows } = await query(
`INSERT INTO users (email, display_name)
VALUES ($1, $2)
ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
RETURNING id, email, display_name, created_at`, //returning
[email, display_name]
);
res.status(201).json(rows[0]);
}));

router.get("/users/:id", wrap(async (req, res) => { 
const { id } = req.params;
const { rows } = await query(
`SELECT id, email, display_name, created_at
 FROM users
 WHERE id = $1`,            
[id]
);
if (rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
    }                                                                               
res.status(200).json(rows[0]);
}));

/** POSITIONS (for one user -> many positions) */
// POST /api/positions
// POST /api/positions
router.post("/positions", wrap(async (req, res) => {
  const {
    user_id,
    age,
    company_input,
    position_title,
    belief = ""
  } = req.body ?? {};

  // validate
  if (!Number.isInteger(Number(user_id))) {
    return res.status(400).json({ error: "Missing or invalid 'user_id' (must be users.id integer)" });
  }
  if (!Number.isInteger(Number(age))) {
    return res.status(400).json({ error: "Missing or invalid 'age' (integer required)" });
  }
  if (!company_input || !position_title) {
    return res.status(400).json({ error: "Missing 'company_input' or 'position_title'" });
  }

  const { rows } = await query(
    `INSERT INTO positions (user_id, age, company_input, position_title, belief)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id,
               user_id,
               age,
               company_name,  -- GENERATED
               city,          -- GENERATED
               position_title,
               belief,
               created_at`,
    [Number(user_id), Number(age), company_input, position_title, belief]
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


// APPLICATIONS (for one user -> many applications to positions)

router.post("/applications", wrap(async (req, res) => {
  const { user_id, position_id, qa, evaluation = "" } = req.body ?? {};

  if (!user_id || !position_id) {
    return res.status(400).json({ error: "Missing 'user_id' or 'position_id'" });
  }
  if (!Array.isArray(qa)) {
    return res.status(400).json({ error: "'qa' must be an array" });
  }

  const { rows } = await query(
    `INSERT INTO applications (user_id, position_id, qa, evaluation)
     VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT (user_id, position_id) DO UPDATE
       SET qa = EXCLUDED.qa,
           evaluation = EXCLUDED.evaluation,
           updated_at = now()
     RETURNING id, user_id, position_id, qa, evaluation, created_at, updated_at`,
    [user_id, position_id, JSON.stringify(qa), evaluation]
  );

  res.status(201).json(rows[0]);
}));

export default router;