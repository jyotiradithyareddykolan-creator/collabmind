import { GoogleGenAI } from "@google/genai";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callWithRetry = async (fn, retries = 3, delay = 1500) => {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      await sleep(delay);
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
};

// Converts a piece of text into an embedding vector (array of numbers)
export const generateEmbedding = async (text) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });
    return response.embeddings[0].values;
  });
};

// Generates a written answer, grounded in the given context chunks
export const generateAnswer = async (question, contextChunks) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const context = contextChunks.map((c) => c.text).join("\n\n---\n\n");

    const prompt = `You are a research assistant. Answer the question using ONLY the context below. If the answer isn't in the context, say you don't know.

Context:
${context}

Question: ${question}

Answer:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  });
};

// Generates text from a raw, fully custom prompt — no fixed template.
// Used for anything that isn't simple "answer this question from context" Q&A.
export const generateText = async (prompt) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  });
};