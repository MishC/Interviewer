export type QuestionType = "text" | "radio";


export interface Question {
id: number;
text: string;
type: QuestionType;
placeholder?: string;
options?: (string | number)[];
}


export interface Profile {
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