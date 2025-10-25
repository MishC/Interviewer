export type QuestionType = "text" | "radio";


export interface Question {
id: number;
text: string;
type: QuestionType;
placeholder?: string;
options?: (string | number)[];
}


export interface Profile {
id: number;      
name: string;
email:string;
age: string; 
role: string;
company: string; 
bestThing: string;
}

export interface RecordAudioResponse {  
audioUrl: string;
}

export type SavedUser = {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
};

export type ApplicationPayload = {
  user_id: number;
  position_id: number;
  qa: any[];                
  evaluation?: string;
};


export type SavedPosition = {
  id: number;
  user_id: number;
  age: number;
  company_name: string | null;
  city: string | null;
  position_title: string;
  belief: string;
  created_at: string;
};

//Audio
export type RecorderControlsProps = {
  start: () => void;
  stop: () => void;
  status: "idle" | "recording" | "stopped";
  isProcessing: boolean;
};

export type StreamProps = {
  wsUrl?: string;                 // default: ws://localhost:4001/ws/stt
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  mimeType?: string;              // "audio/webm" default
  timesliceMs?: number;           // 250ms default
  Controls: React.ComponentType<RecorderControlsProps>;
};




