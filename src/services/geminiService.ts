/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export async function getWordInfo(word: string) {
  const wordClean = word.toLowerCase().trim();
  
  // 1. Check Firestore Cache First
  try {
    const cacheRef = doc(db, 'word_cache', wordClean);
    // Use a timeout for the cache fetch to avoid hanging on connection issues
    const cacheSnap = await Promise.race([
      getDoc(cacheRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]) as any;

    if (cacheSnap && cacheSnap.exists()) {
      return cacheSnap.data() as { definition: string; hint: string; uz: string; ru: string };
    }
  } catch (e) {
    console.warn("Cache read bypassed due to error or timeout:", e);
    // Continue to Gemini if cache fails
  }

  // 2. Fetch from Gemini if not cached
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, simple English definition (max 15 words), a one-sentence hint (that doesn't use the word itself), and translations into Uzbek and Russian for the English word: "${wordClean}". 
    Format the response as a JSON object with keys "definition", "hint", "uz" (Uzbek translation), and "ru" (Russian translation).`,
    });

    const text = response.text || "";
    
    // Extract JSON from the response text
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      
      // 3. Save to Cache for future use
      try {
        await setDoc(doc(db, 'word_cache', wordClean), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Cache write error:", e);
      }
      
      return data;
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
