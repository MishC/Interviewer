import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes.js";
import { closePool } from "./db.js";


dotenv.config();


const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));


// Mount all API routes under /api
app.use("/api", router);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
console.log(`API running on http://localhost:${PORT}`);
});


// Graceful shutdown
const shutdown = async (signal) => {
console.log(`${signal} received. Shutting down...`);
try {
await closePool();
} catch (e) {
console.error("Error closing DB pool:", e.message);
} finally {
process.exit(0);
}
};


process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));