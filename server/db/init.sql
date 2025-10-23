-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POSITIONS
-- company_input: user may type "Google, Dublin" in one field
-- company_name, city are auto-parsed (generated columns) but can be edited later if you prefer.
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  company_input TEXT NOT NULL,                               -- e.g. "Google, Dublin"
  company_name  TEXT GENERATED ALWAYS AS (                   
  
      NULLIF(btrim(split_part(company_input, ',', 1)), '')
  ) STORED,
  city          TEXT GENERATED ALWAYS AS (                  
      NULLIF(btrim(split_part(company_input, ',', 2)), '')
  ) STORED,
  
  position_title TEXT NOT NULL,
  belief         TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);

-- APPLICATIONS (user x position) with QA JSON
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Array of 10 items; each item: {question_id, question_text, type, answer:{text,audio_url,transcript}}
  qa JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_file_url TEXT NOT NULL DEFAULT '',   -- link/path to PDF export

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_app_per_user_position UNIQUE (user_id, position_id),
  CONSTRAINT chk_qa_array CHECK (jsonb_typeof(qa) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_applications_user      ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_position  ON applications(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_qa_gin    ON applications USING GIN (qa);

-- Optional: trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_updated ON applications;
CREATE TRIGGER trg_app_updated
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
