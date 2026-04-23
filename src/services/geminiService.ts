/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export async function getWordInfo(word: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, simple English definition (max 15 words), a one-sentence hint (that doesn't use the word itself), and translations into Uzbek and Russian for the English word: "${word}". 
    Format the response as a JSON object with keys "definition", "hint", "uz" (Uzbek translation), and "ru" (Russian translation).`,
    });

    const text = response.text || "";
    
    // Extract JSON from the response text
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching word info:", error);
    return {
      definition: "A vocabulary word from your unit.",
      hint: "Try to guess the correct spelling!",
      uz: "So'z",
      ru: "Слово"
    };
  }
}
