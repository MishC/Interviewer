-- seed.sql — demo data for users, positions, applications (qa JSON)
-- Works with your USERS / POSITIONS (company_input -> company_name, city) / APPLICATIONS (qa JSONB) schema

BEGIN;

----------------------------------------
-- 1) USER
----------------------------------------
INSERT INTO users (email, display_name)
SELECT 'user@example.com', 'Demo User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com');

----------------------------------------
-- 2) POSITIONS
--    company_input like "Company, City" (DB auto-derives company_name, city)
----------------------------------------
WITH u AS (
  SELECT id AS user_id FROM users WHERE email = 'user@example.com'
)
INSERT INTO positions (user_id, age, company_input, position_title, belief)
SELECT u.user_id, 'Eviny, Bergen', 'Data Analyst Trainee',
       'I believe in using data to accelerate the green transition.'
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM positions p
  WHERE p.user_id = u.user_id
    AND p.age = 28,
    AND p.company_input = 'Eviny, Bergen'
    AND p.position_title = 'Data Analyst Trainee'
);

WITH u AS (
  SELECT id AS user_id FROM users WHERE email = 'user@example.com'
)
INSERT INTO positions (user_id, age, company_input, position_title, belief)
SELECT u.user_id, 'Lerøy, Bergen', 'IT Trainee',
       'I believe in digital transformation for sustainable seafood.'
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM positions p
  WHERE p.user_id = u.user_id
    AND p.age = 32,
    AND p.company_input = 'Lerøy, Bergen'
    AND p.position_title = 'IT Trainee'
);

----------------------------------------
-- 3) APPLICATIONS with 10 Q/A (JSONB)
--    Uses ON CONFLICT (user_id, position_id) to stay idempotent but refresh content if you tweak below.
----------------------------------------

-- For Eviny, Bergen
WITH u AS (
  SELECT id AS user_id FROM users WHERE email = 'user@example.com'
),
pos AS (
  SELECT id AS position_id
  FROM positions
  WHERE company_input = 'Eviny, Bergen' AND position_title = 'Data Analyst Trainee'
)
INSERT INTO applications (user_id, position_id, qa, summary_file_url)
SELECT
  u.user_id,
  pos.position_id,
  '[
     {"question_id":1,"question_text":"Tell us about yourself and your career journey so far.","type":"text","answer":{"text":"Physicist → developer; React/.NET & cloud.","audio_url":"","transcript":""}},
     {"question_id":2,"question_text":"How structured are you on a scale of 1–10?","type":"radio","options":[1,2,3,4,5,6,7,8,9,10],"answer":{"text":"9","audio_url":"","transcript":""}},
     {"question_id":3,"question_text":"Why this company/role?","type":"text","answer":{"text":"Mission + impact + growth.","audio_url":"","transcript":""}},
     {"question_id":4,"question_text":"A difficult problem you solved","type":"text","answer":{"text":"Migrated legacy ETL to cloud.","audio_url":"","transcript":""}},
     {"question_id":5,"question_text":"Tech you most enjoy","type":"select","options":["React","Node",".NET","Python","SQL"],"answer":{"text":"React, SQL","audio_url":"","transcript":""}},
     {"question_id":6,"question_text":"Biggest strength for this role","type":"text","answer":{"text":"Structured + data-driven.","audio_url":"","transcript":""}},
     {"question_id":7,"question_text":"Area you want to improve","type":"text","answer":{"text":"Advanced statistics.","audio_url":"","transcript":""}},
     {"question_id":8,"question_text":"Preferred work style","type":"text","answer":{"text":"Async first, clear ownership.","audio_url":"","transcript":""}},
     {"question_id":9,"question_text":"Example of teamwork","type":"text","answer":{"text":"Cross-functional delivery with QA & Data.","audio_url":"","transcript":""}},
     {"question_id":10,"question_text":"What would you do in the first 90 days?","type":"text","answer":{"text":"Map KPIs, quick wins, data quality.","audio_url":"","transcript":""}}
   ]'::jsonb,
  ''
FROM u, pos
ON CONFLICT (user_id, position_id) DO UPDATE
  SET qa = EXCLUDED.qa,
      summary_file_url = EXCLUDED.summary_file_url,
      updated_at = now();

-- For Lerøy, Bergen
WITH u AS (
  SELECT id AS user_id FROM users WHERE email = 'user@example.com'
),
pos AS (
  SELECT id AS position_id
  FROM positions
  WHERE company_input = 'Lerøy, Bergen' AND position_title = 'IT Trainee'
)
INSERT INTO applications (user_id, position_id, qa, summary_file_url)
SELECT
  u.user_id,
  pos.position_id,
  '[
     {"question_id":1,"question_text":"Tell us about yourself and your career journey so far.","type":"text","answer":{"text":"Full-stack dev with data focus.","audio_url":"","transcript":""}},
     {"question_id":2,"question_text":"How structured are you on a scale of 1–10?","type":"radio","options":[1,2,3,4,5,6,7,8,9,10],"answer":{"text":"8","audio_url":"","transcript":""}},
     {"question_id":3,"question_text":"Why this company/role?","type":"text","answer":{"text":"Sustainability + digitalization.","audio_url":"","transcript":""}},
     {"question_id":4,"question_text":"A difficult problem you solved","type":"text","answer":{"text":"Reduced report time 80% via SQL.","audio_url":"","transcript":""}},
     {"question_id":5,"question_text":"Tech you most enjoy","type":"select","options":["React","Node",".NET","Python","SQL"],"answer":{"text":"Python, SQL","audio_url":"","transcript":""}},
     {"question_id":6,"question_text":"Biggest strength for this role","type":"text","answer":{"text":"Curiosity + delivery.","audio_url":"","transcript":""}},
     {"question_id":7,"question_text":"Area you want to improve","type":"text","answer":{"text":"Cloud cost optimization.","audio_url":"","transcript":""}},
     {"question_id":8,"question_text":"Preferred work style","type":"text","answer":{"text":"Iterative, feedback-driven.","audio_url":"","transcript":""}},
     {"question_id":9,"question_text":"Example of teamwork","type":"text","answer":{"text":"Pairing with data engineers.","audio_url":"","transcript":""}},
     {"question_id":10,"question_text":"What would you do in the first 90 days?","type":"text","answer":{"text":"Understand domain, ship small wins.","audio_url":"","transcript":""}}
   ]'::jsonb,
  ''
FROM u, pos
ON CONFLICT (user_id, position_id) DO UPDATE
  SET qa = EXCLUDED.qa,
      summary_file_url = EXCLUDED.summary_file_url,
      updated_at = now();

COMMIT;
