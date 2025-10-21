import React from "react";
import type { Profile } from "../types";


export default function Input({ label, name, value, onChange, type = "text", placeholder = "" }: {
label: string; name: keyof Profile; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>; type?: string; placeholder?: string;
}) {
return (
<div>
<label htmlFor={name as string} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
<input id={name as string} name={name as string} type={type} value={value} onChange={onChange}
placeholder={placeholder}
className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150" required />
</div>
);
}