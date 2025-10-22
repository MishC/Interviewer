import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import type { Profile, Question } from "./types";
import { selectRandomQuestions } from "./data/questions";
import { saveUser, createPosition } from "./lib/api";
import { resolveEmail, isValidEmail } from "./lib/email";
import { geminiGenerateEvaluation, geminiSpeak, browserSpeak } from "./lib/gemini";
import Input from "./components/Input";
import QuestionCard from "./components/QuestionCard";
import Results from "./components/Results";
import "./index.css";
import "react-h5-audio-player/lib/styles.css";



export default function App() {
  // 1=Setup, 2=Quiz, 3=Results
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", age: "", role: "", company: "", bestThing: "" });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);


  useEffect(() => { setQuestions(selectRandomQuestions()); }, []);
  const currentQuestion = questions[currentQIndex];

  const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }, []);


  const startQuiz = useCallback(async () => {
    setError(null);

    // Validation of input fields of profile values before proceeding to quiz
    const must = [profile.name, profile.age, profile.role, profile.company, profile.bestThing];
    const allFilled = must.every((v) => String(v).trim() !== "");
    const ageOk = profile.age === "" || !Number.isNaN(Number(profile.age));

    // Email is not mandatory but if provided, must be valid
    const emailProvided = (profile.email ?? "").trim() !== "";
    const emailOk = !emailProvided || isValidEmail(profile.email);

    if (!allFilled || !ageOk || !emailOk) {
      setError("Please fill in all fields correctly.");
      return;
    }

    try {
      setIsLoading(true);

      // 1) email is resolved
      const emailFinal = resolveEmail(profile.email ?? "", profile.name);

      // 2) Save user to db
      // returns user object
      const user = await saveUser({
        display_name: profile.name,
        email: emailFinal,
      });

      // 3) Create position entry to the db
      await createPosition({
        user_id: user.id,                    
        company_input: profile.company,       // e.g. "Google, London"
        position_title: profile.role,
        belief: profile.bestThing
      });

      //Quiz begins
      setPhase(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Failed to start. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const handleAnswerChange = useCallback((qid: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }, []);

  const isCurrentAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    const a = answers[currentQuestion.id];
    return Boolean(a && String(a).trim() !== "");
  }, [answers, currentQuestion]);

  const prevQuestion = useCallback(() => { if (currentQIndex > 0) setCurrentQIndex((i) => i - 1); }, [currentQIndex]);

  const doEvaluation = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const qa = questions.map((q) => ({ question: q.text, answer: answers[q.id] ?? "" }));
      const text = await geminiGenerateEvaluation({ profile, qa });
      setEvaluation(text);
      setPhase(3);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally { setIsLoading(false); }
  }, [answers, profile, questions]);

  /* AUDIO GENERATION WITH BROWSER TTS*/
  const playVoice = useCallback(async () => {
    if (!evaluation) return;
    const audioElement = await geminiSpeak(evaluation, "Kore");
    setAudioUrl(audioElement.src);
  }, [evaluation]);


  const restart = useCallback(() => {
    setPhase(1); setCurrentQIndex(0); setAnswers({}); setEvaluation(null); setProfile({ name: "", email: "", age: "", role: "", company: "", bestThing: "" }); setQuestions(selectRandomQuestions()); setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center font-sans">
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background-color: #a0aec0; border-radius: 4px; }
        ::-webkit-scrollbar-track { background-color: #f7fafc; }
      `}</style>
      <div className="w-full max-w-5xl">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">First Round Interview Simulator</h1>
          <p className="text-gray-600 mt-2 text-xl">Practice key behavioral and motivational questions</p>
        </header>

        {error && (
          <div className="max-w-xl mx-auto p-3 mb-6 text-sm text-red-800 bg-red-100 rounded-lg">{error}</div>
        )}

        {phase === 1 && (
          <div className="max-w-xl mx-auto p-6 bg-white shadow-2xl rounded-xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Candidate Profile Setup</h2>
            <div className="space-y-4">
              <Input label="Name" name="name" value={profile.name} onChange={handleProfileChange} type="text" placeholder="John Doe" />
              <Input
                label="Email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                type="email"
                placeholder="you@youremail.com"
              />
              <Input label="Age" name="age" value={profile.age} onChange={handleProfileChange} type="number" placeholder="25" />
              <Input label="Position you are applying for" name="role" value={profile.role} onChange={handleProfileChange} type="text" placeholder="Senior Frontend Developer" />
              <Input label="Company Name and Location (City)" name="company" value={profile.company} onChange={handleProfileChange} type="text" placeholder="Google, London" />
              <Input label="The best thing I will do in this field (Personal conviction)" name="bestThing" value={profile.bestThing} onChange={handleProfileChange} type="text" placeholder="Bring innovation and simplify user processes" />
            </div>
            <button onClick={startQuiz} className="mt-8 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.01]">Start Interview Simulation</button>
          </div>
        )}

        {phase === 2 && currentQuestion && (
          <div className="max-w-2xl mx-auto p-6 bg-white shadow-2xl rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-600">Question {currentQIndex + 1} of 10</h2>
              <div className="text-lg font-medium text-gray-600">Role: {profile.role}</div>
            </div>
            <QuestionCard q={currentQuestion} value={answers[currentQuestion.id]} onChange={(v) => handleAnswerChange(currentQuestion.id, v)} />
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
              <button onClick={prevQuestion} disabled={currentQIndex === 0} className="px-6 py-2 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition">&larr; Back</button>
              {currentQIndex < questions.length - 1 ? (
                <button onClick={() => setCurrentQIndex((i) => i + 1)} disabled={!isCurrentAnswered} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Next Question &rarr;</button>
              ) : (
                <button onClick={doEvaluation} disabled={!isCurrentAnswered || isLoading} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                  {isLoading ? "Generating Evaluation..." : "Finish and Get Evaluation"}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 3 && (
          <Results
            evaluation={evaluation}
            profile={profile}
            // onReplay={playVoice}
            onRestart={restart}
            audioUrl={audioUrl ?? undefined}
            qa={questions.map((q) => ({
              question: q.text,
              answer: answers[q.id] || "",
            }))}
          />

        )}
      </div>
    </div>
  );
}
