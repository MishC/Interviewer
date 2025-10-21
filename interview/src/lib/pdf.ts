// src/lib/pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Profile } from "../types";

/**
 * Build interview PDF: autoTable for Q&A, then wrapped text for evaluation.
 */
export function buildInterviewPdf({
  profile,
  qa,
  evaluation,
}: {
  profile: Profile;
  qa: { question: string; answer: string }[];
  evaluation: string;
}) {
  const doc = new jsPDF();
  const marginLeft = 14;
  const pageHeight = doc.internal.pageSize.getHeight();

  // Optional logo
  // doc.addImage("/logo.png", "PNG", 160, 10, 30, 15);

  // --- Title and Candidate Info ---
  doc.setFontSize(16);
  doc.text("Interview Report", marginLeft, 16);

  doc.setFontSize(12);
  const infoY = 26;
  const infoLines = [
    `Name: ${profile.name}`,
    `Age: ${profile.age}`,
    `Role: ${profile.role}`,
    `Company: ${profile.company}`,
    `Belief: ${profile.bestThing}`,
  ];
  infoLines.forEach((line, i) => doc.text(line, marginLeft, infoY + i * 6));

  // --- Q&A Table ---
  autoTable(doc, {
    startY: 60,
    head: [["#", "Question", "Answer"]],
    body: qa.map((x, i) => [i + 1, x.question, x.answer || "—"]),
    styles: { fontSize: 9, cellWidth: "wrap" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 85 },
      2: { cellWidth: 85 },
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
    },
  });

  // --- Evaluation Section ---
  let y = (doc as any).lastAutoTable?.finalY || 70;
  if (y + 40 > pageHeight) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.text("HR Evaluation", marginLeft, y + 14);
  doc.setFontSize(10);

  // Split the evaluation text into multiple lines based on width
  const wrapped = doc.splitTextToSize(evaluation, 180);

  // Auto-paginate long evaluation text
  let cursorY = y + 26;
  const lineHeight = 12;
  wrapped.forEach((line: string) => {
    if (cursorY + lineHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = 30;
    }
    doc.text(line, marginLeft, cursorY);
    cursorY += lineHeight;
  });

  return doc;
}
