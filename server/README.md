Hi!

This program use Gemini AI prompt to have a role as a senior HR analyst (15 years experience). It asks you 10 of most common behavioural interview questions. You can answer either by directly typing to the text field or by voice, when you press on the green record button, because this app use streaming speech recognition by Google.
In the end you will get the evaluation of your interview in written form, all your answers to questions, as well
as the recommendation how to answer more professionaly in the context of the hiring company and final 
verdict if you advance to the next round of the interview or not.

This program aims to use google cloud to host the postgre database in the future, and use ML to fine tune the answers of AI HR analyst, or just make generalizations about data.


## 🧱 System Architecture

| Component | Runs where | Port | Purpose |
|------------|-------------|------|----------|
| **PostgreSQL** | 🐳 Docker container | **5432** | Stores all application data (users, positions, applications with QA JSON) |
| **Adminer** | 🐳 Docker container | **5000** | Web UI to inspect and manage the Postgres database |
| **Backend (Node.js / Express)** | 💻 Host machine | **4000** | REST API server — connects to PostgreSQL and serves endpoints (`/api/...`) |
| **Frontend (React / Vite)** | 💻 Host machine | **5173** (default) | Web client in folder interview that calls the backend API (`http://localhost:4000/api/...`) |

---

### 🔗 Connection flow

```text
 ┌────────────────────────────┐
 │        React/Vite          │
 │     (http://localhost:5173)│
 └────────────┬───────────────┘
              │  API calls
              ▼
 ┌────────────────────────────┐
 │      Node.js / Express     │
 │     (http://localhost:4000)│
 └────────────┬───────────────┘
              │  SQL queries
              ▼
 ┌────────────────────────────┐
 │        PostgreSQL DB       │
 │     (docker:5432 <-> host) │
 └────────────┬───────────────┘
              │  optional
              ▼
 ┌────────────────────────────┐
 │          Adminer           │
 │     (http://localhost:5000)│
 └────────────────────────────┘
```

---

### 🌐 Example environment setup

`.env`
```env
# Node server
PORT=4000
NODE_ENV=development

# PostgreSQL (Docker)
DATABASE_URL=postgres://appuser:appsecret@127.0.0.1:5432/interviewer
PGSSL=false
```

---

### 🧩 Services startup

```bash
# Start Postgres + Adminer
cd server
docker compose up -d

# Install backend node dependencies (package.json)
npm i --save

# Run backend (Express)
npm run dev

# Install frontend dependencies (package.json)
cd interview
npm i --save

# Run frontend (Vite)
npm run dev --prefix interview
```

Then open:

- 🌍 API health: **http://localhost:4000/api/health**  
- 🧠 Adminer UI: **http://localhost:5000**  
- 💻 Frontend: **http://localhost:5173**

## TEST API
### Test for /users POST
Create a new user
 ```
 curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "julia@example.com",
    "display_name": "Julia Adger"
  }' 

  ```
### Test for /positions POST
Create new position for user with user_id

```
curl -X POST http://localhost:4000/api/positions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "age": 27,
    "company_input": "Eviny, Bergen",
    "position_title": "Data Analyst Trainee",
    "belief": "I want to simplify data processes and learn cloud analytics."
  }'

```
### Test for /applications POST

Record of all questions and answers from the quiz

```
curl -X POST http://localhost:4000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "position_id": 3,
    "qa": [
      {
        "question_id": 1,
        "question_text": "Tell us about yourself and your career journey so far.",
        "type": "text",
        "answer": {
          "text": "Physicist → Developer; strong in data & cloud.",
          "audio_url": "",
          "transcript": ""
        }
      },
      {
        "question_id": 2,
        "question_text": "How structured are you on a scale of 1–10?",
        "type": "radio",
        "options": [1,2,3,4,5,6,7,8,9,10],
        "answer": {
          "text": "9",
          "audio_url": "",
          "transcript": ""
        }
      }
    ],
    "evaluation": ""
  }'

```