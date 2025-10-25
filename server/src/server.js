import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes.js";
import { closePool } from "./db.js";
/*import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import { v1p1beta1 as speech } from "@google-cloud/speech";*/


dotenv.config();

// Set up express server
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
// Mount all API routes under /api
app.use("/api", router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
console.log(`API running on http://localhost:${PORT}`);
});

// -------- WS on :4001 --------
/*const WS_PORT = 4001;
const wss = new WebSocketServer({ port: WS_PORT, path: "/ws/stt" });
console.log(`WS listening on ws://localhost:${WS_PORT}/ws/stt`);

const speechClient = new speech.SpeechClient();

// WS handler (single stream per connection)
wss.on("connection", (ws) => {
  // 1) Create the Google stream with config UP FRONT (first frame is guaranteed)
  const recognizeStream = speechClient
    .streamingRecognize({
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: process.env.LANGUAGE_CODE || "nb-NO",
        enableAutomaticPunctuation: true,
      },
      interimResults: true, // this belongs alongside config when using ctor
    })
    .on("error", (err) => {
      safeSend(ws, { error: "STT error: " + err.message });
      try { ws.close(); } catch {}
    })
    .on("data", (data) => {
      const alt = data.results?.[0]?.alternatives?.[0]?.transcript || "";
      const isFinal = data.results?.[0]?.isFinal;
      if (alt) safeSend(ws, isFinal ? { final: alt } : { interim: alt });
    });

  // 2) Start ffmpeg AFTER stream is created
  const ff = spawn("ffmpeg", [
    "-loglevel", "error",
    "-f", "webm",
    "-i", "pipe:0",
    "-ac", "1",
    "-ar", "16000",
    "-f", "s16le",
    "pipe:1",
  ]);

  // helpful when debugging input issues:
  ff.stderr?.on("data", (d) => console.error("ffmpeg:", d.toString()));

  ff.on("error", (e) => {
    safeSend(ws, { error: "ffmpeg failed: " + e.message });
    try { ws.close(); } catch {}
  });

  // 3) Only send audioContent frames afterward
  ff.stdout.on("data", (chunk) => {
    recognizeStream.write({ audioContent: chunk });
  });

  ff.on("close", () => {
    try { recognizeStream.end(); } catch {}
  });

  ws.on("message", (msg) => {
    if (typeof msg === "string") {
      try {
        const o = JSON.parse(msg);
        if (o?.event === "end") try { ff.stdin.end(); } catch {}
      } catch {}
      return;
    }
    try { ff.stdin.write(Buffer.from(msg)); } catch {}
  });

  ws.on("close", () => {
    try { ff.stdin.end(); } catch {}
  });
});


function safeSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}
*/
// Graceful shutdown (optional)
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  try { await closePool(); } catch (e) { console.error("Error closing DB pool:", e.message); }
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));