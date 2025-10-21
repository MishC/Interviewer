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
age: string; 
role: string;
company: string; 
bestThing: string;
}