import type { Profile } from "../types";
import { MessageSquareText } from "lucide-react";
import { buildInterviewPdf } from "../lib/pdf";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

export default function Results({
  evaluation,
  profile,
  onReplay,      // optional “generate & set audioUrl” action (if you keep it)
  onRestart,
  audioUrl,
  qa,
}: {
  evaluation: string | null;
  profile: Profile;
  qa: { question: string; answer: string }[];
  onReplay?: () => void;
  onRestart: () => void;
  audioUrl?: string;
}) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-2xl rounded-xl">
      <h2 className="text-4xl font-extrabold text-green-700 mb-4 flex items-center">
        <MessageSquareText className="w-8 h-8 mr-3" /> HR Specialist Evaluation
      </h2>

      <p className="text-xl text-gray-700 mb-8 border-b pb-4">
        Feedback for the role: <span className="font-bold text-indigo-600">{profile.role}</span> (Age: {profile.age})
      </p>

      {evaluation ? (
        <div className="space-y-6">
          {/* 🎵 Audio player (reloads when audioUrl changes) */}
          {audioUrl && (
            <AudioPlayer
              key={audioUrl}                 // ✅ forces fresh mount when url updates
              src={audioUrl}
              showJumpControls={false}
              layout="horizontal"
              customAdditionalControls={[]}
              autoPlayAfterSrcChange
              onEnded={() => console.log("Playback finished")}
              onPlay={() => console.log("Playing...")}
              onPause={() => console.log("Paused")}
            />
          )}

          {/* Evaluation text */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
            {evaluation}
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <button
              onClick={() => {
                const doc = buildInterviewPdf({
                  profile,
                  qa,
                  evaluation: evaluation ?? "",
                });
                doc.save(`Interview_${profile.name}_${profile.role}.pdf`);
              }}
              className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition duration-300"
            >
              Download Report (PDF)
            </button>

            <button
              onClick={onRestart}
              className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
            >
              Start New Interview
            </button>

    
          </div>
        </div>
      ) : (
        <p className="text-red-500 font-medium">Evaluation failed to load. Please try again.</p>
      )}
    </div>
  );
}
