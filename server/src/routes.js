import { Router } from "express";
import { query } from "./db.js";


const router = Router();


// Small helper to wrap route handlers and forward errors
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


/** Healthcheck */
router.get("/health", wrap(async (_req, res) => {
await query("SELECT 1");
res.json({ ok: true });
}));


/** USERS */
router.post("/users", wrap(async (req, res) => {
const { email, display_name = "" } = req.body ?? {};
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

/** ANSWERS */

//POST ANSWERS
router.post("/answers", wrap(async (req, res) => {
const { user_id = null, position_id, question_id, text = "", audio_url = "", transcript = "" } = req.body ?? {};
if (!position_id || !question_id) {
return res.status(400).json({ error: "Missing 'position_id' or 'question_id'" });
}


const { rows } = await query(
`INSERT INTO answers (user_id, position_id, question_id, text, audio_url, transcript)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (position_id, question_id) DO UPDATE
SET text = EXCLUDED.text,
audio_url = EXCLUDED.audio_url,
transcript = EXCLUDED.transcript
RETURNING *`,
[user_id, position_id, question_id, text, audio_url, transcript]
);
res.status(201).json(rows[0]);
}));

// GET answers (optionally by position)
router.get("/answers", wrap(async (req, res) => {
const { position_id } = req.query;
const { rows } = await query(
position_id
? `SELECT a.*, q.text AS question_text
FROM answers a
JOIN questions q ON q.id = a.question_id
WHERE a.position_id = $1
ORDER BY a.created_at DESC`
: `SELECT a.*, q.text AS question_text
FROM answers a
JOIN questions q ON q.id = a.question_id
ORDER BY a.created_at DESC
LIMIT 100`,
position_id ? [position_id] : []
);
res.json(rows);
}));

/** QUESTIONS */
// Get all active questions for user
router.get("/questions", wrap(async (_req, res) => {
const { rows } = await query(
`SELECT id, text, type, options, is_active
FROM questions
WHERE is_active = true
ORDER BY id ASC`
);
res.json(rows);
}));

/**Optional Create a new question */

router.post("/questions", wrap(async (req, res) => {
const { text, type = "text", options = [] } = req.body ?? {};
if (!text) return res.status(400).json({ error: "Missing 'text'" });

const { rows } = await query(
`INSERT INTO questions (text, type, options)
VALUES ($1, $2, $3)
RETURNING *`,
[text, type, JSON.stringify(options)]
);
res.status(201).json(rows[0]);
}));

export default router;