import type { Question } from "../types";
import { Mic } from "lucide-react";


export default function QuestionCard({ q, value, onChange }: { q: Question; value?: string | number; onChange: (v: string) => void; }) {
return (
<div>
<div className="mb-8 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
<p className="text-xl font-semibold text-gray-800">{q.text}</p>
</div>
<div className="space-y-4">
{q.type === "text" && (
<div className="relative">
<textarea rows={5} className="w-full p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
placeholder={q.placeholder} value={typeof value === "string" ? value : value ?? ""}
onChange={(e) => onChange(e.target.value)} />
<div className="absolute top-2 right-2 text-gray-400 flex items-center">
</div>
</div>
)}
{q.type === "radio" && (
<div className="space-y-3">
{q.options?.map((opt) => (
<label key={String(opt)} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-50 transition duration-150">
<input type="radio" name={`q-${q.id}`} value={String(opt)}
checked={String(value) === String(opt)} onChange={(e) => onChange(e.target.value)}
className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
<span className="ml-3 text-gray-700 font-medium">{String(opt)}</span>
</label>
))}
</div>
)}
</div>
</div>
);
}