// test-file-stream.js (Opravená verzia)

import dotenv from "dotenv";
dotenv.config();
import { spawn } from 'child_process';
import { v1p1beta1 as speech } from '@google-cloud/speech';
import fs from 'fs'; // 🚨 DÔLEŽITÉ: Importujte File System modul

const speechClient = new speech.SpeechClient();
const filename = './uploads/sample.webm'; 

// -----------------------------------------------------
// 1. Nastavenie GPC Streamu (Zostáva nezmenené)
// -----------------------------------------------------
const recognizeStream = speechClient
  .streamingRecognize({
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    },
    interimResults: true,
  })
  .on('error', console.error)
  .on('data', (data) => {
    const alt = data.results?.[0]?.alternatives?.[0]?.transcript;
    const isFinal = data.results?.[0]?.isFinal;
    if (alt) console.log(isFinal ? '[FINAL]' : '[INT]', alt);
  });

// -----------------------------------------------------
// 2. Nastavenie ffmpeg procesu (Zostáva nezmenené)
// -----------------------------------------------------
const ff = spawn('ffmpeg', [
  '-loglevel','error',
  '-f','webm',     
  '-i','pipe:0',
  '-acodec','pcm_s16le',
  '-ac','1',
  '-ar','16000',
  '-f','s16le',
  'pipe:1',
]);

ff.stdout.pipe(recognizeStream);            // ffmpeg output -> Google API

ff.on('close', () => recognizeStream.end());

// Optional: Log ffmpeg errors
ff.stderr?.on('data', d => console.error('[ffmpeg-error]', d.toString().trim()));

// -----------------------------------------------------
// 3. 🚨 NOVÝ KROK: ODOSLANIE SÚBORU DO FFMPEG 🚨
// -----------------------------------------------------
if (!fs.existsSync(filename)) {
    console.error(`\n❌ Súbor nebol nájdený: ${filename}`);
    process.exit(1);
}

// Vytvorí čitateľný stream zo súboru
const fileReadStream = fs.createReadStream(filename);

// Pošle obsah súboru priamo na štandardný vstup ffmpeg procesu
console.log(`\n▶️ Spúšťam prepis súboru: ${filename}`);
fileReadStream.pipe(ff.stdin); 

fileReadStream.on('end', () => {
    // Keď sa skončí čítanie súboru, ukončí sa vstup do ffmpeg
    ff.stdin.end(); 
});