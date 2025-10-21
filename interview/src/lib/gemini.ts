
import type { Profile } from "../types";
let GEMINI_KEY: string | undefined;

// Try to read from Vite (browser build)
GEMINI_KEY=import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";


export async function geminiGenerateEvaluation(params: { profile: Profile; qa: { question: string; answer: string }[]; }) {
if (!GEMINI_KEY) throw new Error("Missing VITE_GEMINI_API_KEY env.");
const { profile, qa } = params;


const userQuery = `Evaluate the candidate's performance in the first round interview.


Candidate Profile:
- Name: ${profile.name}
- Age: ${profile.age} years old
- Role: ${profile.role}
- Company and Location: ${profile.company}
- Personal belief (best thing in the field): ${profile.bestThing}


Candidate's answers to 10 questions:
${qa.map((x, i) => `${i + 1}. Question: \"${x.question}\"
Answer: \"${x.answer || "Unanswered/Empty response"}\"`).join("\n")
}


INSTRUCTIONS FOR EVALUATION (CRITICAL):
1. **Search Context:** Use Google Search to find recent news, culture, and job requirements for the position \"${profile.role}\" at \"${profile.company}\". Integrate this specific company knowledge into your feedback.
2. Provide an overall assessment of the candidate's performance (positives and negatives) specifically relating their answers to the company's presumed values/needs based on your search.
3. Identify the 3 weakest/most problematic answers.
4. For each of these 3 answers, provide specific advice and suggest an optimal response that is **tailored to the found company context (e.g., mentioning a specific project or value of the company)**.
5. Adjust the overall strictness and tone based on the age ${profile.age} and the role ${profile.role}. Be direct but constructive.
6. All output MUST be in English.`;

const systemPrompt = `You are an HR Director with 15 years of experience who 
has just conducted an interview for the ${profile.role}
 position at ${profile.company}. 
 Your goal is to provide precise and detailed feedback that is 
 highly relevant to the specific company the candidate applied to.
  You MUST use the Google Search tool to gather context before formulating 
  the evaluation. The final sentence of your evalution is recommending whether to
   proceed to the next interview round or not.`;


const url = `${GEMINI_BASE}/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_KEY}`;
const payload = {
contents: [{ parts: [{ text: userQuery }] }],
systemInstruction: { parts: [{ text: systemPrompt }] },
tools: [{ google_search: {} }],
} as const;


const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
if (!res.ok) throw new Error(`Gemini evaluation HTTP ${res.status}`);
const json = await res.json();
const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No evaluation was generated.";
return text as string;
}


// TTS via Gemini audio modality. Returns an HTMLAudioElement already loaded.
export async function geminiSpeak(text: string, voiceName = "Kore"): Promise<HTMLAudioElement> {
  if (!GEMINI_KEY) throw new Error("Missing VITE_GEMINI_API_KEY env.");

  const url = `${GEMINI_BASE}/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_KEY}`;
  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  } as const;

  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`Gemini TTS HTTP ${res.status}`);
  const json = await res.json();

  // Attempt to locate base64 audio in multiple shapes
  let b64: string | undefined;
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p?.inline_data?.data) { b64 = p.inline_data.data; break; }
    if (p?.inlineData?.data) { b64 = p.inlineData.data; break; }
    if (typeof p?.text === "string" && p.text.startsWith("data:audio")) { b64 = p.text.split(",")[1]; break; }
  }

  if (!b64) throw new Error("No audio received from Gemini.");
  const byteString = atob(b64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  const blob = new Blob([ab], { type: "audio/wav" });
  const urlObj = URL.createObjectURL(blob);
  const audio = new Audio(urlObj);
  return audio;
}
//Fallback browser TTS
export function browserSpeak(text: string) {
  if (typeof window === "undefined") return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0; utter.pitch = 1.0; utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
}
