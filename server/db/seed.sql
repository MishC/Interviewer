-- seed.sql — insert demo data if not exists
SELECT 'user@example.com', 'Demo User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com');

-- POSITIONS (applications)
WITH u AS (SELECT id AS user_id FROM users WHERE email = 'user@example.com')
INSERT INTO positions (user_id, company_name, position_title, belief, status)
SELECT u.user_id, 'Eviny', 'Data Analyst Trainee',
       'I believe in using data to make Norway’s green transition more efficient.',
       'in_progress'
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM positions
  WHERE company_name = 'Eviny' AND position_title = 'Data Analyst Trainee'
);

WITH u AS (SELECT id AS user_id FROM users WHERE email = 'user@example.com')
INSERT INTO positions (user_id, company_name, position_title, belief, status)
SELECT u.user_id, 'Lerøy', 'IT Trainee',
       'I believe in digital transformation that supports sustainable seafood production.',
       'draft'
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM positions
  WHERE company_name = 'Lerøy' AND position_title = 'IT Trainee'
);

-- QUESTIONS
INSERT INTO questions (text, type, options, is_active)
SELECT 'Tell us about yourself and your career journey so far.', 'text', '[]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE lower(text)=lower('Tell us about yourself and your career journey so far.'));

INSERT INTO questions (text, type, options, is_active)
SELECT 'How structured are you on a scale of 1 to 10?', 'radio', '[1,2,3,4,5,6,7,8,9,10]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE lower(text)=lower('How structured are you on a scale of 1 to 10?'));

INSERT INTO questions (text, type, options, is_active)
SELECT 'Why did you choose our company/this specific position?', 'text', '[]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE lower(text)=lower('Why did you choose our company/this specific position?'));

-- DEMO ANSWER
WITH u AS (SELECT id AS user_id FROM users WHERE email = 'user@example.com'),
pos AS (
  SELECT id AS position_id FROM positions
  WHERE company_name = 'Eviny' AND position_title = 'Data Analyst Trainee'
),
q AS (
  SELECT id AS question_id FROM questions
  WHERE lower(text) = lower('Tell us about yourself and your career journey so far.')
)
INSERT INTO answers (user_id, position_id, question_id, text)
SELECT u.user_id, pos.position_id, q.question_id,
       'Physicist turned developer; building data-driven tools with React, .NET, and cloud.'
FROM u, pos, q
WHERE NOT EXISTS (
  SELECT 1 FROM answers a
  WHERE a.user_id = u.user_id AND a.position_id = pos.position_id AND a.question_id = q.question_id
);

-- DEMO DOCUMENT
WITH u AS (SELECT id AS user_id FROM users WHERE email = 'user@example.com'),
pos AS (
  SELECT id AS position_id FROM positions
  WHERE company_name = 'Eviny' AND position_title = 'Data Analyst Trainee'
)
INSERT INTO documents (user_id, position_id, doc_type, file_url, storage_provider, meta)
SELECT u.user_id, pos.position_id, 'export_pdf', '/files/eviny-application.pdf', 'local',
       '{"filename":"eviny-application.pdf","contentType":"application/pdf"}'::jsonb
FROM u, pos
WHERE NOT EXISTS (
  SELECT 1 FROM documents d
  WHERE d.user_id = u.user_id AND d.position_id = pos.position_id AND d.doc_type = 'export_pdf'
);
