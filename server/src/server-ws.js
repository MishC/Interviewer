import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { v1p1beta1 as speech } from '@google-cloud/speech';

dotenv.config()
const wss = new WebSocketServer({ port: 4001, path: '/ws/stt' });
console.log('WS on ws://localhost:4001/ws/stt');

const speechClient = new speech.SpeechClient();

function safeSend(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

wss.on('connection', (ws) => {
  console.log('[WS] open');

  const recognizeStream = speechClient
    .streamingRecognize({
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: process.env.LANGUAGE_CODE || 'nb-NO',
        enableAutomaticPunctuation: true,
      },
      interimResults: true,
    })
    .on('error', (err) => {
      console.error('[STT]', err.message);
      safeSend(ws, { error: 'STT error: ' + err.message });
      try { ws.close(); } catch {}
    })
    .on('data', (data) => {
      const alt = data.results?.[0]?.alternatives?.[0]?.transcript || '';
      const isFinal = data.results?.[0]?.isFinal;
      if (!alt) return;
      safeSend(ws, isFinal ? { final: alt } : { interim: alt });
    });

  const ff = spawn('ffmpeg', [
    '-loglevel','error',
    '-f','webm',         // musí sedieť s MediaRecorder mimeType
    '-i','pipe:0',
    '-acodec','pcm_s16le',
    '-ac','1',
    '-ar','16000',
    '-f','s16le',
    'pipe:1',
  ]);

  ff.stderr?.on('data', d => console.error('[ffmpeg]', d.toString().trim()));
  ff.on('error', (e) => {
    console.error('[ffmpeg proc]', e.message);
    safeSend(ws, { error: 'ffmpeg failed: ' + e.message });
    try { ws.close(); } catch {}
  });

  // raw bytes → Google
  ff.stdout.pipe(recognizeStream);
  ff.on('close', () => recognizeStream.end());

  ws.on('message', (msg) => {
    if (typeof msg === 'string') {
      try { const o = JSON.parse(msg); if (o?.event === 'end') ff.stdin.end(); } catch {}
      return;
    }
    ff.stdin.write(Buffer.from(msg));
  });

  ws.on('close', () => { try { ff.stdin.end(); } catch {} });
});
