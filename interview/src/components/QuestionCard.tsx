import React from "react";
import type { Question } from "../types";
import RecorderControls from "./RecorderControls";
import LiveSTT from "./LiveSTT";

export default function QuestionCard({
  q, value, onChange
}: { q: Question; value?: string | number; onChange: (v: string) => void; }) {

  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  // 1) persistent accumulator that does not suffer from stale props
  const accRef = React.useRef<string>("");

  // 2) initialize accumulator when the component/question mounts/changes
  React.useEffect(() => {
    accRef.current =
      typeof value === "string" ? value :
      value != null ? String(value) : "";
  // re-init only when q.id changes (prevents resets while streaming)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  // 3) helper to append chunk safely and sync up
  const appendFinal = React.useCallback((chunk: string) => {
    if (!chunk) return;
    const needsSpace = accRef.current && !/\s$/.test(accRef.current);
    accRef.current = accRef.current + (needsSpace ? " " : "") + chunk;
    onChange(accRef.current); // push the full, latest text to parent

    // optional: auto-scroll textarea
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.scrollTop = taRef.current.scrollHeight;
    });
  }, [onChange]);

  // 4) ignore interim completely (so nothing overwrites)
  const onInterim = (_t: string) => {};

  const onFinal = (t: string) => appendFinal(t);

  const displayText =
    typeof value === "string" ? value :
    value != null ? String(value) : "";

  return (
    <div>
      <div className="mb-8 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
        <p className="text-xl font-semibold text-gray-800">{q.text}</p>
      </div>

      <div className="space-y-4">
        {q.type === "text" && (
          <div className="relative">
            <textarea
              ref={taRef}
              rows={6}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-y"
              placeholder={q.placeholder}
              value={displayText}
              onChange={(e) => {
                accRef.current = e.target.value;   // keep ref in sync if user types
                onChange(e.target.value);
              }}
            />

            <div className="mt-2">
              <LiveSTT
                Controls={RecorderControls}
                onInterim={onInterim}     // ignore interim
                onFinal={onFinal}         // append-only via ref
                mimeType="audio/webm"
                wsUrl="ws://localhost:4001/ws/stt"
                timesliceMs={250}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
