import { useCallback } from 'react';

export function useTTS() {
  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
