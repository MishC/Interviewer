import { type RecorderControlsProps } from "../types";
import { useState} from "react";

const RecorderControls: React.FC<RecorderControlsProps> = ({
  start,
  stop,
  status,
  isProcessing,
}) => {
  const recording = status === "recording";
  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {!recording ? (
          <button
            onClick={start}
            disabled={isProcessing}
            className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50 flex items-center gap-2"
            aria-label="Start Recording"
            title="Start"
          >
            <i className="bx bx-microphone"></i>
            Start
          </button>
        ) : (
          <button
            onClick={stop}
            disabled={isProcessing}
            className="px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50 flex items-center gap-2"
            aria-label="Stop Recording"
            title="Stop"
          >
            <i className ='bx  bx-stop-circle'  ></i>  Stop
          </button>
        )}
      </div>
      {/* arbitrary */}
       <small className="text-gray-500">{recording ? "Recording..." : "Ready"}</small> 
    </div>
  );
};

export default RecorderControls;