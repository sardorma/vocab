/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RotateCcw, Shuffle, Sparkles, CheckCircle2, Lightbulb, Trophy } from 'lucide-react';
import { Unit } from '../../data/vocabulary.ts';
import { getWordInfo } from '../../services/geminiService.ts';

interface WordScrambleProps {
  unit: Unit;
  onBack: () => void;
  onWordMastered: (word: string) => void;
  onGameFinished: () => void;
  wordCache: Record<string, { definition: string; hint: string; uz: string; ru: string }>;
  onUpdateWordCache: (word: string, info: { definition: string; hint: string; uz: string; ru: string }) => void;
}

export default function WordScramble({ unit, onBack, onWordMastered, onGameFinished, wordCache, onUpdateWordCache }: WordScrambleProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [score, setScore] = useState(0);
  const [wordInfo, setWordInfo] = useState<{ definition: string; hint: string; uz: string; ru: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isFinished, setIsFinished] = useState(false);

  const currentWord = unit.words[currentWordIndex].toUpperCase();

  useEffect(() => {
    if (!isFinished) {
      shuffleWord();
      loadWordInfo();
    }
  }, [currentWordIndex, isFinished]);

  const loadWordInfo = async () => {
    setIsLoading(true);
    
    const wordKey = unit.words[currentWordIndex].toLowerCase();
    const cached = wordCache[wordKey];
    if (cached) {
      setWordInfo(cached);
      setIsLoading(false);
      return;
    }

    const info = await getWordInfo(unit.words[currentWordIndex]);
    setWordInfo(info);
    onUpdateWordCache(unit.words[currentWordIndex], info);
    setIsLoading(false);
  };

  const shuffleWord = () => {
    const word = currentWord.split('');
    const shuffled = word.sort(() => Math.random() - 0.5).join('');
    if (shuffled === currentWord && currentWord.length > 1) {
      shuffleWord();
    } else {
      setScrambledWord(shuffled);
      setUserInput('');
      setFeedback('none');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toUpperCase() === currentWord) {
      setFeedback('correct');
      setScore(s => s + 5);
      onWordMastered(unit.words[currentWordIndex]);
      setTimeout(() => {
        if (currentWordIndex < unit.words.length - 1) {
          setCurrentWordIndex(i => i + 1);
        } else {
          setIsFinished(true);
          onGameFinished();
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 1000);
    }
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-surface p-12 rounded-3xl border-4 border-border shadow-2xl text-center space-y-8 glass-card"
      >
        <div className="w-24 h-24 bg-highlight/10 text-highlight rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(236,72,153,0.2)]">
          <Trophy size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text-primary tracking-tight uppercase tracking-widest">Scramble Solved!</h2>
          <p className="text-text-secondary font-medium">You identified all word patterns.</p>
        </div>
        <div className="py-6 border-y border-border">
           <span className="text-5xl font-black text-highlight drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">{score}</span>
           <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-2">Final Score</p>
        </div>
        <button 
          onClick={onBack}
          className="w-full py-4 bg-highlight text-bg rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)]"
        >
          GO BACK
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium transition-colors">
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="px-4 py-1.5 bg-highlight/10 border border-highlight/20 rounded-full flex items-center gap-2">
          <Sparkles size={16} className="text-highlight" />
          <span className="text-sm font-bold text-highlight">Score: {score}</span>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border-2 border-border shadow-2xl overflow-hidden glass-card">
        <div className="bg-bg p-8 text-center border-b border-border text-text-primary relative">
          <h2 className="text-3xl font-black tracking-widest uppercase text-highlight mb-2">Word Scramble</h2>
          <p className="text-text-secondary text-sm italic">
            {isLoading ? "Consulting AI Archive..." : `"${wordInfo?.definition}"`}
          </p>
          
          <AnimatePresence>
            {!isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center gap-2 mt-4"
              >
                <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent uppercase tracking-tighter">UZ: {wordInfo?.uz}</span>
                <span className="px-2 py-0.5 bg-highlight/10 border border-highlight/20 rounded text-[10px] font-bold text-highlight uppercase tracking-tighter">RU: {wordInfo?.ru}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-wrap justify-center gap-3">
            {isLoading ? (
              <div className="py-6 flex gap-2">
                {[1,2,3,4].map(i => <div key={i} className="w-12 h-12 bg-bg border border-border rounded-xl animate-pulse" />)}
              </div>
            ) : (
              scrambledWord.split('').map((char, idx) => (
                <motion.div
                  key={idx + scrambledWord}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="w-14 h-14 bg-bg border-2 border-border rounded-xl flex items-center justify-center text-2xl font-black text-highlight shadow-[0_0_10px_rgba(236,72,153,0.1)] transition-colors"
                >
                  {char}
                </motion.div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              autoFocus
              type="text"
              autoComplete="off"
              value={userInput}
              onInput={(e: any) => setUserInput(e.target.value)}
              placeholder="Your guess..."
              className={`w-full text-center text-4xl font-black py-8 tracking-[0.2em] bg-bg border-4 rounded-2xl outline-none transition-all uppercase ${
                feedback === 'correct' ? 'border-highlight bg-highlight/5' : 
                feedback === 'wrong' ? 'border-highlight bg-highlight/5 animate-shake' : 
                'border-border focus:border-highlight focus:bg-surface text-text-primary'
              }`}
            />

            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex-[2] py-5 bg-highlight text-bg rounded-full font-black text-lg hover:bg-white shadow-lg shadow-highlight/10 transition-all uppercase tracking-widest"
              >
                IDENTIFY WORD
              </button>
              <button 
                type="button"
                onClick={shuffleWord}
                className="px-8 py-5 bg-transparent text-highlight border-2 border-highlight/30 rounded-full font-bold hover:bg-highlight/10 transition-all flex items-center justify-center gap-2"
              >
                <Shuffle size={20} />
              </button>
            </div>
          </form>

          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3 text-highlight font-black uppercase tracking-widest text-sm"
              >
                <CheckCircle2 size={24} />
                <span>Pattern Matched</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="px-8 py-4 bg-bg/50 border-t border-border text-center text-[10px] text-text-secondary font-mono uppercase tracking-[0.3em]">
          Sequence {currentWordIndex + 1} OF {unit.words.length}
        </div>
      </div>
    </motion.div>
  );
}
