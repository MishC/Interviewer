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

# Run backend (Express)
npm run dev

# Run frontend (Vite)
npm run dev --prefix interview
```

Then open:

- 🌍 API health: **http://localhost:4000/api/health**  
- 🧠 Adminer UI: **http://localhost:5000**  
- 💻 Frontend: **http://localhost:5173**

## TEST API

