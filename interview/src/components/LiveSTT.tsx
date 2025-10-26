import RecorderControls from "./RecorderControls";
import { type StreamProps } from "../types";
import React from "react";

export default function LiveSTT({
  wsUrl = "ws://localhost:4001/ws/stt",
  onInterim,
  onFinal,
  mimeType = "audio/webm",
  timesliceMs = 250,
  Controls = RecorderControls,
  onRecordingChange 
}: StreamProps) {
  const [status, setStatus] = React.useState<"idle" | "recording" | "stopped">("idle");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const wsRef = React.useRef<WebSocket | null>(null);
  const mrRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  async function start() {
    if (status === "recording" || isProcessing) return; // 1) guard
    setIsProcessing(true);

    try {
      // 0) Mic permissions first ()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 1) WS connect with timeoutom + error handler
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      const openPromise = new Promise<void>((resolve, reject) => {
        const to = setTimeout(() => reject(new Error("WebSocket open timeout")), 8000);
        ws.addEventListener("open", () => { clearTimeout(to); resolve(); }, { once: true });
        ws.addEventListener("error", () => { clearTimeout(to); reject(new Error("WebSocket error")); }, { once: true });
        ws.addEventListener("close", () => {  });
      });

      ws.onmessage = (evt) => {
        try {
          const txt = typeof evt.data === "string" ? evt.data : new TextDecoder().decode(evt.data);
          const msg = JSON.parse(txt);
          if (msg?.error) console.error("STT error:", msg.error);
          if (msg?.interim && onInterim) onInterim(msg.interim);
          if (msg?.final && onFinal) onFinal(msg.final);
        } catch { /* ignore parse */ }
      };

      await openPromise;
      wsRef.current = ws;

      // 2) MediaRecorder (mr) s fallback MIME    

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
      console.log('[Client] using mime audio/webm; codecs=opus');

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size && ws.readyState === ws.OPEN) {
          e.data.arrayBuffer().then((buf) => ws.send(buf)).catch(() => {});
        }
      };
      mr.onstop = () => {
        try { stream.getTracks().forEach((t) => t.stop()); } catch {}
        try { ws.send(JSON.stringify({ event: "end" })); } catch {}
        try { ws.close(); } catch {}
        setStatus("stopped");
        onRecordingChange?.(false);        
      };

      mr.start(timesliceMs);
      mrRef.current = mr;
      setStatus("recording");
      onRecordingChange?.(true); 

      // WS runtime errors → stop recording
      ws.onerror = () => {
        console.error("WS runtime error");
        onRecordingChange?.(false);

        try { mr.stop(); } catch {}
      };
      ws.onclose = () => {
        //if (status === "recording") {
          try { mr.stop(); } catch {}
      //  }
      };

    } catch (err) {
      console.error("start() failed:", err);
      // cleanup pri chybe
      try { mrRef.current?.stop(); } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      try { wsRef.current?.close(); } catch {}
      setStatus("idle");
      onRecordingChange?.(false);

    } finally {
      setIsProcessing(false);
    }
  }

  function stop() {
    try { mrRef.current?.stop(); } catch {}
  }

  React.useEffect(() => {
    return () => {
      try { mrRef.current?.stop(); } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      try { wsRef.current?.close(); } catch {}
      onRecordingChange?.(false);
    };
  }, []);

  return <Controls start={start} stop={stop} status={status} isProcessing={isProcessing} />;
}
