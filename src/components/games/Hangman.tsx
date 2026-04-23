/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RotateCcw, AlertCircle, Skull, Lightbulb, Sparkles, Volume2 } from 'lucide-react';
import { Unit } from '../../data/vocabulary.ts';
import { getWordInfo } from '../../services/geminiService.ts';
import { useTTS } from '../../hooks/useTTS';

interface HangmanProps {
  unit: Unit;
  onBack: () => void;
  onWordMastered: (word: string) => void;
  onGameFinished: () => void;
  wordCache: Record<string, { definition: string; hint: string; uz: string; ru: string }>;
  onUpdateWordCache: (word: string, info: { definition: string; hint: string; uz: string; ru: string }) => void;
}

export default function Hangman({ unit, onBack, onWordMastered, onGameFinished, wordCache, onUpdateWordCache }: HangmanProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const { speak } = useTTS();
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [wordInfo, setWordInfo] = useState<{ definition: string; hint: string; uz: string; ru: string } | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const maxMistakes = 6;
  const currentWord = unit.words[currentWordIndex].toUpperCase();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const displayWord = currentWord.split('').map(char => 
    guessedLetters.includes(char) || !/^[A-Z]$/.test(char) ? char : "_"
  );

  useEffect(() => {
    setGuessedLetters([]);
    setMistakes(0);
    setStatus('playing');
    setShowHint(false);
    setWordInfo(null);
  }, [currentWordIndex]);

  useEffect(() => {
    if (status !== 'playing') return;

    const isWon = currentWord.split('').every(char => 
      !/^[A-Z]$/.test(char) || guessedLetters.includes(char)
    );

    if (isWon) {
      setStatus('won');
      onWordMastered(unit.words[currentWordIndex]);
    }
    if (mistakes >= maxMistakes) {
      setStatus('lost');
    }
  }, [guessedLetters, mistakes]);

  const loadHint = async () => {
    const wordKey = unit.words[currentWordIndex].toLowerCase();
    
    if (wordInfo || wordCache[wordKey]) {
      if (!wordInfo && wordCache[wordKey]) {
        setWordInfo(wordCache[wordKey]);
      }
      setShowHint(!showHint);
      return;
    }
    
    setIsLoadingHint(true);
    const info = await getWordInfo(unit.words[currentWordIndex]);
    setWordInfo(info);
    onUpdateWordCache(unit.words[currentWordIndex], info);
    setIsLoadingHint(false);
    setShowHint(true);
  };

  const handleGuess = (letter: string) => {
    if (status !== 'playing' || guessedLetters.includes(letter)) return;

    setGuessedLetters([...guessedLetters, letter]);
    if (!currentWord.includes(letter)) {
      setMistakes(m => m + 1);
    }
  };

  const resetGame = () => {
    onGameFinished();
    setGuessedLetters([]);
    setMistakes(0);
    setStatus('playing');
    setCurrentWordIndex(i => (i + 1) % unit.words.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium transition-colors">
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="flex items-center gap-4">
           <button 
             onClick={loadHint}
             disabled={isLoadingHint || status !== 'playing'}
             className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${showHint ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface border border-border text-text-secondary hover:border-accent hover:text-accent'}`}
           >
             {isLoadingHint ? "..." : <Lightbulb size={14} />} {showHint ? "Hide Hint" : "Get Hint"}
           </button>
           <div className="px-3 py-1 bg-highlight/10 border border-highlight/20 rounded-lg text-highlight text-xs font-bold uppercase tracking-widest">
            ERRORS: {mistakes} / {maxMistakes}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showHint && wordInfo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-accent/5 border border-accent/20 rounded-2xl p-4 gap-4 flex flex-col sm:flex-row items-center justify-between"
          >
            <div className="text-sm font-medium italic text-text-primary">"{wordInfo.definition}"</div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-accent/20 rounded text-[10px] font-bold text-accent">UZ: {wordInfo.uz}</span>
              <span className="px-2 py-1 bg-highlight/20 rounded text-[10px] font-bold text-highlight">RU: {wordInfo.ru}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface rounded-3xl border-2 border-border shadow-2xl overflow-hidden min-h-[400px] sm:min-h-[500px] flex flex-col md:flex-row glass-card">
        {/* Visual Panel */}
        <div className="w-full md:w-1/3 p-4 sm:p-8 bg-bg flex items-center justify-center relative border-b md:border-b-0 md:border-r border-border min-h-[150px] sm:min-h-0">
          <div className="text-white font-mono scale-75 sm:scale-100">
            <svg width="150" height="200" viewBox="0 0 150 200" className="stroke-accent stroke-[4] fill-none drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              {/* Stand */}
              <line x1="20" y1="180" x2="100" y2="180" className="stroke-border" />
              <line x1="60" y1="180" x2="60" y2="20" className="stroke-border" />
              <line x1="60" y1="20" x2="110" y2="20" className="stroke-border" />
              <line x1="110" y1="20" x2="110" y2="40" className="stroke-border" />
              
              {/* Body parts */}
              {mistakes > 0 && <circle cx="110" cy="55" r="15" />} {/* Head */}
              {mistakes > 1 && <line x1="110" y1="70" x2="110" y2="120" />} {/* Torso */}
              {mistakes > 2 && <line x1="110" y1="80" x2="90" y2="100" />} {/* Left Arm */}
              {mistakes > 3 && <line x1="110" y1="80" x2="130" y2="100" />} {/* Right Arm */}
              {mistakes > 4 && <line x1="110" y1="120" x2="90" y2="150" />} {/* Left Leg */}
              {mistakes > 5 && <line x1="110" y1="120" x2="130" y2="150" />} {/* Right Leg */}
            </svg>
          </div>
          
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 p-1.5 sm:p-2 bg-white/5 rounded-lg text-text-secondary border border-border">
            <Skull size={16} className="sm:hidden" />
            <Skull size={20} className="hidden sm:block" />
          </div>
        </div>

        {/* Interaction Panel */}
        <div className="flex-1 p-4 sm:p-8 space-y-6 sm:space-y-12">
          <div className="text-center relative">
            <div className="absolute -top-1 sm:-top-4 right-0">
               <button 
                 onClick={() => speak(currentWord)}
                 className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                 title="Hear word"
               >
                 <Volume2 size={20} className="sm:hidden" />
                 <Volume2 size={24} className="hidden sm:block" />
               </button>
            </div>
            <div className="flex justify-center flex-wrap gap-1 sm:gap-2 mb-2">
              {displayWord.map((char, i) => (
                <div key={i} className="w-5 min-[400px]:w-8 sm:w-10 h-10 sm:h-12 border-b-2 sm:border-b-4 border-border flex items-center justify-center text-base sm:text-2xl font-black uppercase text-text-primary">
                  {char === "_" ? "" : char}
                </div>
              ))}
            </div>
          </div>

          {status === 'playing' ? (
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 sm:gap-2">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  disabled={guessedLetters.includes(letter)}
                  onClick={() => handleGuess(letter)}
                  className={`h-9 sm:h-11 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-widest ${
                    guessedLetters.includes(letter)
                      ? currentWord.includes(letter) 
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'bg-highlight/5 text-highlight/30 border border-highlight/10'
                      : 'bg-bg border border-border text-text-secondary hover:bg-surface hover:text-accent hover:border-accent shadow-sm'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          ) : (
            <div className={`p-4 sm:p-8 rounded-2xl text-center space-y-4 sm:space-y-6 ${status === 'won' ? 'bg-accent/5 text-accent' : 'bg-highlight/5 text-highlight'} border-2 ${status === 'won' ? 'border-accent/20' : 'border-highlight/20'} glass-card`}>
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {status === 'won' ? <Sparkles size={32} className="text-accent sm:hidden" /> : <Skull size={32} className="text-highlight sm:hidden" />}
                {status === 'won' ? <Sparkles size={48} className="text-accent hidden sm:block" /> : <Skull size={48} className="text-highlight hidden sm:block" />}
                <h3 className="text-xl sm:text-3xl font-black tracking-tight uppercase tracking-widest leading-none">
                  {status === 'won' ? 'Victory!' : 'Terminated'}
                </h3>
                <p className="text-sm font-medium text-text-primary">
                  {status === 'won' ? "Sequence secured!" : `Word was: ${currentWord}`}
                </p>
              </div>
              <button 
                onClick={resetGame}
                className={`w-full py-4 sm:py-5 px-6 rounded-full font-black flex items-center justify-center gap-2 transition-all uppercase tracking-[0.2em] shadow-lg text-xs sm:text-base ${status === 'won' ? 'bg-accent text-bg hover:bg-white' : 'bg-highlight text-bg hover:bg-white'}`}
              >
                <RotateCcw size={18} className="sm:size-5" /> REBOOT SEQUENCE
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
