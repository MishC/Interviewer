-- init.sql — one user, multiple positions, questions/answers, documents (PDFs)

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POSITIONS (one user can have many)
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  belief TEXT NOT NULL DEFAULT '',            -- your personal motivation / belief
  status TEXT NOT NULL DEFAULT 'draft',       -- draft | in_progress | submitted | hired | rejected | archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QUESTIONS (global question set)
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',          -- text | radio | voice | select
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ANSWERS (each belongs to one position + question)
CREATE TABLE IF NOT EXISTS answers (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  audio_url TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_answer_per_position_question UNIQUE (position_id, question_id)
);

-- DOCUMENTS (PDFs, CVs, etc.)
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'export_pdf',    -- export_pdf | cv | cover_letter | attachment | transcript
  file_url TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'local', -- local | s3 | gcs | azure | other
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_positions_user       ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_active     ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_answers_user         ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_position     ON answers(position_id);
CREATE INDEX IF NOT EXISTS idx_answers_question     ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_documents_user       ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_position   ON documents(position_id);
CREATE INDEX IF NOT EXISTS idx_documents_type       ON documents(doc_type);
