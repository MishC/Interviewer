import type { Question } from "../types";

export const ALL_QUESTIONS: Question[] = [
  { id: 1, text: "Tell us about yourself and your career journey so far.", type: "text", placeholder: "Your answer..." },
  { id: 2, text: "How structured are you on a scale of 1 to 10? (1 - chaotic, 10 - highly organized)", type: "radio", options: [1,2,3,4,5,6,7,8,9,10] },

  // NEW: follow-up free-text for Q2
  { id: 21, text: "Briefly explain why you chose that structure rating (1–10).", type: "text", placeholder: "Your explanation..." },

  { id: 3, text: "Why did you choose our company/this specific position?", type: "text", placeholder: "Your answer..." },
  { id: 4, text: "Where do you see yourself in five years?", type: "text", placeholder: "Your answer..." },
  { id: 5, text: "What are your greatest strengths that you would apply to this role?", type: "text", placeholder: "Your answer..." },
  { id: 6, text: "What is your biggest professional weakness, and how are you working on it?", type: "text", placeholder: "Your answer..." },
  { id: 7, text: "Describe a situation where you made a mistake and how you handled it.", type: "text", placeholder: "Your answer..." },
  { id: 8, text: "Why are you leaving your current job (or why did you leave)?", type: "text", placeholder: "Your answer..." },
  { id: 9, text: "How do you handle conflict with a colleague or manager?", type: "text", placeholder: "Your answer..." },
  { id: 10, text: "Describe your ideal work environment.", type: "text", placeholder: "Your answer..." },
  { id: 11, text: "Are you primarily a team player or a leader?", type: "radio", options: ["Team Player","Leader","Both, depending on the situation"] },
  { id: 12, text: "What are your salary expectations?", type: "text", placeholder: "Your answer (be realistic)..." },
  { id: 13, text: "How do you prioritize when everything is urgent?", type: "text", placeholder: "Your answer..." },
  { id: 14, text: "What motivates you the most at work?", type: "text", placeholder: "Your answer..." },
  { id: 15, text: "Why should we hire you?", type: "text", placeholder: "Your answer..." },
  { id: 16, text: "How do you handle stress and pressure?", type: "text", placeholder: "Your answer..." },
  { id: 17, text: "Do you have any questions for us?", type: "radio", options: ["Yes, I do","No, not at the moment"] },
  { id: 18, text: "Describe a complex project you worked on. What was your role?", type: "text", placeholder: "Your answer..." },
  { id: 19, text: "What was your biggest professional risk?", type: "text", placeholder: "Your answer..." },
  { id: 20, text: "What is the most important thing you've learned in the last year?", type: "text", placeholder: "Your answer..." },
];

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Rules:
 * - Always 10 questions.
 * - #1 is always at index 0.
 * - #17 is always at index 9.
 * - Randomly pick 8 others from the remaining pool.
 * - If #2 is included among those 8, inject #21 (free-text follow-up) immediately after #2
 *   and drop one other random item to keep the total count consistent.
 */
export function selectRandomQuestions(): Question[] {
  const q1 = ALL_QUESTIONS.find(q => q.id === 1)!;
  const q17 = ALL_QUESTIONS.find(q => q.id === 17)!;
  const q21 = ALL_QUESTIONS.find(q => q.id === 21)!;

  // pool excludes fixed #1 and #17 and the follow-up #21 (we only inject #21 conditionally)
  const pool = ALL_QUESTIONS.filter(q => ![1, 17, 21].includes(q.id));
  shuffle(pool);

  // take first 8
  let mid = pool.slice(0, 8);

  // if #2 is present, inject #21 after it and remove another item (not #2 or #21) to keep length 8
  const idx2 = mid.findIndex(q => q.id === 2);
  if (idx2 !== -1) {
    // insert #21 right after #2
    mid.splice(idx2 + 1, 0, q21);

    // remove one item from the end that is neither #2 nor #21
    if (mid.length > 8) {
      for (let k = mid.length - 1; k >= 0; k--) {
        const id = mid[k].id;
        if (id !== 2 && id !== 21) {
          mid.splice(k, 1);
          break;
        }
      }
      // fallback: if all else fails (shouldn't), trim to 8
      if (mid.length > 8) mid.length = 8;
    }
  }

  // assemble final list
  const result: Question[] = [q1, ...mid, q17];

  // sanity: ensure exactly 10 (1 fixed + 8 mid (+ optional 21 already handled) + last fixed)
  if (result.length !== 10) {
    // trim or pad defensively (shouldn't happen, but guard anyway)
    const needed = 10 - result.length;
    if (needed > 0) {
      // add more from pool (skipping ids already in result)
      const used = new Set(result.map(q => q.id));
      for (const q of pool) {
        if (!used.has(q.id)) {
          result.splice(result.length - 1, 0, q); // before last
          if (result.length === 10) break;
        }
      }
    } else if (needed < 0) {
      // remove from the middle section
      result.splice(1, Math.min(result.length - 2 - 8, -(needed)));
    }
  }

  return result;
}
