/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play, LayoutGrid, Type, Ghost, Search, Book } from 'lucide-react';
import { Unit } from '../data/vocabulary.ts';
import { getWordInfo } from '../services/geminiService.ts';

interface UnitDetailProps {
  unit: Unit;
  onBack: () => void;
  onStartGame: (game: any) => void;
  masteredWords: string[];
  gamesPlayed: number;
  wordCache: Record<string, { definition: string; hint: string; uz: string; ru: string }>;
  onUpdateWordCache: (word: string, info: { definition: string; hint: string; uz: string; ru: string }) => void;
}

export default function UnitDetail({ unit, onBack, onStartGame, masteredWords, gamesPlayed, wordCache, onUpdateWordCache }: UnitDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const filteredWords = unit.words.filter(word => 
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWordClick = async (word: string) => {
    if (selectedWord === word) {
      setSelectedWord(null);
      return;
    }
    
    setSelectedWord(word);
    
    if (!wordCache[word.toLowerCase()]) {
      setIsFetchingInfo(true);
      try {
        const info = await getWordInfo(word);
        onUpdateWordCache(word, info);
      } catch (err) {
        console.error("Failed to fetch word info", err);
      } finally {
        setIsFetchingInfo(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Back & Title ... */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-bg transition-colors text-text-secondary"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{unit.title}</h2>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-secondary mt-1">
              <span>{unit.words.length} Words</span>
              <span className="text-accent">{masteredWords.length} Mastered</span>
              <span className="text-highlight">{gamesPlayed} Games played</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all w-48 sm:w-64 text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Selected Word Detail (Translation View) */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-surface border-2 border-accent/20 rounded-3xl shadow-xl glass-card relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
               <button onClick={() => setSelectedWord(null)} className="text-text-secondary hover:text-text-primary transition-colors text-xl font-black">×</button>
            </div>
            
            {isFetchingInfo && !wordCache[selectedWord.toLowerCase()] ? (
              <div className="py-8 flex flex-col items-center gap-4">
                 <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                 <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Consulting AI...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <h3 className="text-4xl font-extrabold text-accent uppercase tracking-tighter">{selectedWord}</h3>
                  <div className="flex gap-2 pb-1">
                    <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent uppercase">Translation View</span>
                  </div>
                </div>
                
                <p className="text-lg text-text-primary italic">"{wordCache[selectedWord.toLowerCase()]?.definition}"</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-bg border border-border rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-50">Uzbek</span>
                    <p className="text-xl font-bold text-accent">{wordCache[selectedWord.toLowerCase()]?.uz}</p>
                  </div>
                  <div className="p-4 bg-bg border border-border rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-50">Russian</span>
                    <p className="text-xl font-bold text-highlight">{wordCache[selectedWord.toLowerCase()]?.ru}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Modes ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GameCard 
          icon={<Type className="text-accent" />}
          title="Spelling Sprint"
          description="Type the words correctly from hints. Perfect for memorization."
          color="accent"
          onClick={() => onStartGame('spelling')}
        />
        <GameCard 
          icon={<LayoutGrid className="text-highlight" />}
          title="Word Scramble"
          description="Unscramble letters to find the word hidden in the mess."
          color="highlight"
          onClick={() => onStartGame('scramble')}
        />
        <GameCard 
          icon={<Ghost className="text-accent" />}
          title="Hangman"
          description="Classic word guessing. Don't let the man hang!"
          color="accent"
          onClick={() => onStartGame('hangman')}
        />
      </div>

      {/* Word List */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm glass-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg/50">
          <div className="flex items-center gap-2">
            <Book size={18} className="text-accent" />
            <h3 className="font-bold text-text-primary tracking-tight text-lg">Vocabulary List</h3>
          </div>
          <div className="text-xs font-mono font-bold text-text-secondary">
             {masteredWords.length} / {unit.words.length} COMPLETED
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredWords.map((word, index) => {
              const isMastered = masteredWords.includes(word);
              const isSelected = selectedWord === word;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => handleWordClick(word)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all text-center truncate relative cursor-pointer group/word ${
                    isSelected
                      ? 'border-accent bg-accent/20 text-accent scale-105 z-10'
                      : isMastered 
                        ? 'bg-accent/10 border-accent/30 text-accent' 
                        : 'bg-bg border-border text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {word}
                  {isMastered && !isSelected && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_5px_var(--color-accent)]" />
                  )}
                </motion.div>
              );
            })}
          </div>
          {filteredWords.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-text-secondary italic">No words match your search.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GameCard({ icon, title, description, color, onClick }: any) {
  const colors: any = {
    accent: "bg-surface border-border hover:border-accent",
    highlight: "bg-surface border-border hover:border-highlight"
  };

  const glow: any = {
    accent: "group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    highlight: "group-hover:shadow-[0_0_15px_rgba(236,72,153,0.2)]"
  };

  return (
    <div 
      onClick={onClick}
      className={`group p-6 rounded-2xl border ${colors[color]} ${glow[color]} cursor-pointer shadow-sm transition-all relative overflow-hidden`}
    >
      <div className="relative z-10 flex flex-col h-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-bg border border-border shadow-sm">
            {icon}
          </div>
          <h4 className="font-bold text-text-primary group-hover:text-text-primary transition-colors">{title}</h4>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed font-medium">
          {description}
        </p>
        <div className="pt-2 mt-auto">
          <div className={`inline-flex items-center gap-2 text-sm font-bold ${color === 'accent' ? 'text-accent' : 'text-highlight'} font-mono uppercase tracking-widest`}>
            PLAY NOW <Play size={14} fill="currentColor" />
          </div>
        </div>
      </div>
      
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full transition-opacity group-hover:opacity-20 ${color === 'accent' ? 'bg-accent' : 'bg-highlight'}`} />
    </div>
  );
}
