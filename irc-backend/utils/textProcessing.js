import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

// Reads a PDF buffer (already in memory) and returns its raw text content
export const extractTextFromPDF = async (fileBuffer) => {
  const parser = new PDFParse({ data: fileBuffer });
  const result = await parser.getText();
  return result.text;
};

// Splits a long piece of text into overlapping chunks
export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
};