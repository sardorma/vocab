/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, Sparkles, AlertCircle, CheckCircle2, RotateCcw, Lightbulb, Trophy, Brain } from 'lucide-react';
import { Unit } from '../../data/vocabulary.ts';
import { getWordInfo } from '../../services/geminiService.ts';

interface SpellingSprintProps {
  unit: Unit;
  onBack: () => void;
  onWordMastered: (word: string) => void;
  onGameFinished: () => void;
  wordCache: Record<string, { definition: string; hint: string; uz: string; ru: string }>;
  onUpdateWordCache: (word: string, info: { definition: string; hint: string; uz: string; ru: string }) => void;
}

export default function SpellingSprint({ unit, onBack, onWordMastered, onGameFinished, wordCache, onUpdateWordCache }: SpellingSprintProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [wordInfo, setWordInfo] = useState<{ definition: string; hint: string; uz: string; ru: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const [isFinished, setIsFinished] = useState(false);

  const currentWord = unit.words[currentWordIndex];

  useEffect(() => {
    if (!isFinished) {
      loadWordInfo();
    }
  }, [currentWordIndex, isFinished]);

  const loadWordInfo = async () => {
    setIsLoading(true);
    setFeedback('none');
    setShowHint(false);
    setUserInput('');
    
    const cached = wordCache[currentWord.toLowerCase()];
    if (cached) {
      setWordInfo(cached);
      setIsLoading(false);
      return;
    }

    const info = await getWordInfo(currentWord);
    setWordInfo(info);
    onUpdateWordCache(currentWord, info);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toLowerCase().trim() === currentWord.toLowerCase()) {
      setFeedback('correct');
      setScore(s => s + 10);
      onWordMastered(currentWord);
      setTimeout(() => {
        nextWord();
      }, 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 1000);
    }
  };

  const nextWord = () => {
    if (currentWordIndex < unit.words.length - 1) {
      setCurrentWordIndex(i => i + 1);
    } else {
      setIsFinished(true);
      onGameFinished();
    }
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-surface p-12 rounded-3xl border-4 border-border shadow-2xl text-center space-y-8 glass-card"
      >
        <div className="w-24 h-24 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          <Trophy size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text-primary tracking-tight uppercase tracking-widest">Sprint Complete!</h2>
          <p className="text-text-secondary font-medium">You've mastered this unit's spelling.</p>
        </div>
        <div className="py-6 border-y border-border">
           <span className="text-5xl font-black text-accent drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{score}</span>
           <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-2">Final Score</p>
        </div>
        <button 
          onClick={onBack}
          className="w-full py-4 bg-accent text-bg rounded-2xl font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
        >
          GO BACK
        </button>
      </motion.div>
    );
  }

  const skipWord = () => {
    nextWord();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-medium">
          <ChevronLeft size={20} />
          Back to Unit
        </button>
        <div className="px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="text-sm font-bold text-accent">Score: {score}</span>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border-2 border-border shadow-2xl overflow-hidden glass-card">
        <div className="bg-bg p-8 text-center text-text-primary relative border-b border-border">
          <div className="absolute top-4 right-4 text-xs font-bold bg-white/5 px-2 py-1 rounded text-text-secondary border border-border">
            {currentWordIndex + 1} / {unit.words.length}
          </div>
          <h2 className="text-3xl font-black tracking-widest uppercase text-accent mb-2">Spelling Sprint</h2>
          <p className="text-text-secondary text-sm">Decode the definition using the provided hint</p>
        </div>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-text-secondary font-mono animate-pulse uppercase tracking-widest text-xs">AI Processing...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-surface border border-border text-accent shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <Brain size={32} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl font-medium text-text-primary leading-relaxed italic px-4">
                      "{wordInfo?.definition}"
                    </p>
                    {/* Translations */}
                    <div className="flex flex-wrap justify-center gap-3">
                       <div className="px-4 py-2 bg-accent/5 border border-accent/20 rounded-xl text-sm font-bold">
                         <span className="text-text-secondary block text-[10px] uppercase tracking-tighter opacity-50 mb-0.5">UZBEK</span>
                         <span className="text-accent">{wordInfo?.uz}</span>
                       </div>
                       <div className="px-4 py-2 bg-highlight/5 border border-highlight/20 rounded-xl text-sm font-bold">
                         <span className="text-text-secondary block text-[10px] uppercase tracking-tighter opacity-50 mb-0.5">RUSSIAN</span>
                         <span className="text-highlight">{wordInfo?.ru}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input 
                      autoFocus
                      type="text"
                      autoComplete="off"
                      value={userInput}
                      onInput={(e: any) => setUserInput(e.target.value)}
                      placeholder="Type the word!"
                      className={`w-full text-center text-4xl font-black py-8 px-4 bg-bg border-4 rounded-2xl outline-none transition-all uppercase tracking-[0.2em] ${
                        feedback === 'correct' ? 'border-accent bg-accent/5' : 
                        feedback === 'wrong' ? 'border-highlight bg-highlight/5 animate-shake' : 
                        'border-border focus:border-accent focus:bg-surface'
                      }`}
                    />
                    
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <AnimatePresence>
                        {feedback === 'correct' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent">
                            <CheckCircle2 size={40} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="submit"
                      disabled={!userInput.trim() || feedback === 'correct'}
                      className="flex-1 py-5 bg-accent text-bg rounded-full font-black text-lg hover:bg-white disabled:opacity-30 transition-all uppercase tracking-widest shadow-lg shadow-accent/10"
                    >
                      VERIFY
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className={`px-8 py-5 rounded-full font-black transition-all flex items-center justify-center gap-2 border-2 ${showHint ? 'bg-highlight text-bg border-highlight shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-transparent text-text-secondary border-border hover:border-text-secondary'}`}
                    >
                      <Lightbulb size={24} />
                    </button>
                  </div>
                </form>

                <AnimatePresence>
                  {showHint && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 bg-highlight/10 border border-highlight/20 rounded-2xl flex items-start gap-4"
                    >
                      <AlertCircle className="text-highlight shrink-0 mt-0.5" size={20} />
                      <p className="text-sm font-medium text-text-primary leading-relaxed">
                        <span className="font-bold uppercase tracking-widest text-xs text-highlight block mb-1">Clue Detected</span>
                        {wordInfo?.hint}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-8 py-5 bg-bg/50 border-t border-border flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-[0.1em]">
           <button onClick={skipWord} className="hover:text-text-primary transition-colors">Skip word</button>
           <div className="flex items-center gap-1.5">
             <div className={`w-2 h-2 rounded-full ${feedback === 'correct' ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : feedback === 'wrong' ? 'bg-highlight shadow-[0_0_8px_var(--color-highlight)]' : 'bg-border'}`}></div>
             {feedback === 'correct' ? 'Confirmed' : feedback === 'wrong' ? 'Access Denied' : 'Awaiting Input'}
           </div>
        </div>
        
        {/* Neon Progress Bar */}
        <div className="h-1 bg-border w-full relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-highlight shadow-[0_0_10px_var(--color-accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentWordIndex + 1) / unit.words.length) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
