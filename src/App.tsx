/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Trophy, Sparkles, GraduationCap, ChevronLeft, Gamepad2, Brain, Languages } from 'lucide-react';
import { units, Unit } from './data/vocabulary.ts';
import Dashboard from './components/Dashboard.tsx';
import UnitDetail from './components/UnitDetail.tsx';
import SpellingSprint from './components/games/SpellingSprint.tsx';
import WordScramble from './components/games/WordScramble.tsx';
import Hangman from './components/games/Hangman.tsx';

type View = 'dashboard' | 'unitDetail' | 'spelling' | 'scramble' | 'hangman';

interface UnitStats {
  masteredWords: string[];
  gamesPlayed: number;
}

interface Stats {
  unitStats: Record<number, UnitStats>;
  totalScore: number;
  wordCache: Record<string, { definition: string; hint: string; uz: string; ru: string }>;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [stats, setStats] = useState<Stats>({ 
    unitStats: {}, 
    totalScore: 0,
    wordCache: {}
  });

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('lingolift_v2_stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setStats({
          ...parsed,
          wordCache: parsed.wordCache || {}
        });
      } catch (e) {
        console.error("Failed to parse stats", e);
      }
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lingolift_v2_stats', JSON.stringify(stats));
  }, [stats]);

  const updateUnitStats = (unitId: number, masteredWord?: string, gameFinished?: boolean) => {
    setStats(prev => {
      const currentUnitStats = prev.unitStats[unitId] || { masteredWords: [], gamesPlayed: 0 };
      
      let newMasteredWords = [...currentUnitStats.masteredWords];
      if (masteredWord && !newMasteredWords.includes(masteredWord)) {
        newMasteredWords.push(masteredWord);
      }

      return {
        ...prev,
        unitStats: {
          ...prev.unitStats,
          [unitId]: {
            masteredWords: newMasteredWords,
            gamesPlayed: currentUnitStats.gamesPlayed + (gameFinished ? 1 : 0)
          }
        }
      };
    });
  };

  const updateWordCache = (word: string, info: { definition: string; hint: string; uz: string; ru: string }) => {
    setStats(prev => ({
      ...prev,
      wordCache: {
        ...prev.wordCache,
        [word.toLowerCase()]: info
      }
    }));
  };

  const navigateToUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setCurrentView('unitDetail');
  };

  const startGame = (game: View) => {
    setCurrentView(game);
  };

  const goBack = () => {
    if (currentView === 'unitDetail') {
      setCurrentView('dashboard');
      setSelectedUnit(null);
    } else {
      setCurrentView('unitDetail');
    }
  };

  const totalMastered = (Object.values(stats.unitStats) as UnitStats[]).reduce((acc, curr) => acc + (curr.masteredWords?.length || 0), 0);
  const totalGames = (Object.values(stats.unitStats) as UnitStats[]).reduce((acc, curr) => acc + (curr.gamesPlayed || 0), 0);

  return (
    <div className="min-h-screen bg-bg font-sans text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => { setCurrentView('dashboard'); setSelectedUnit(null); }}
          >
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-bg shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
              <Languages size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              LingoLift <span className="text-accent">Vocab</span>
            </h1>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-text-secondary">
            <div className="hidden sm:flex items-center gap-1.5">
              <Brain size={16} className="text-accent" />
              <span>{totalMastered} Mastered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gamepad2 size={16} className="text-highlight" />
              <span>{totalGames} Games</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard 
                units={units}
                onUnitSelect={navigateToUnit}
                unitStats={stats.unitStats}
              />
            </motion.div>
          )}

          {currentView === 'unitDetail' && selectedUnit && (
            <motion.div
              key="unitDetail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UnitDetail 
                unit={selectedUnit}
                onBack={goBack}
                onStartGame={startGame}
                masteredWords={stats.unitStats[selectedUnit.id]?.masteredWords || []}
                gamesPlayed={stats.unitStats[selectedUnit.id]?.gamesPlayed || 0}
                wordCache={stats.wordCache}
                onUpdateWordCache={updateWordCache}
              />
            </motion.div>
          )}

          {currentView === 'spelling' && selectedUnit && (
            <motion.div
              key="spelling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SpellingSprint 
                unit={selectedUnit}
                onBack={goBack}
                onWordMastered={(word) => updateUnitStats(selectedUnit.id, word)}
                onGameFinished={() => updateUnitStats(selectedUnit.id, undefined, true)}
                wordCache={stats.wordCache}
                onUpdateWordCache={updateWordCache}
              />
            </motion.div>
          )}

          {currentView === 'scramble' && selectedUnit && (
            <motion.div
              key="scramble"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WordScramble 
                unit={selectedUnit}
                onBack={goBack}
                onWordMastered={(word) => updateUnitStats(selectedUnit.id, word)}
                onGameFinished={() => updateUnitStats(selectedUnit.id, undefined, true)}
                wordCache={stats.wordCache}
                onUpdateWordCache={updateWordCache}
              />
            </motion.div>
          )}

          {currentView === 'hangman' && selectedUnit && (
            <motion.div
              key="hangman"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hangman 
                unit={selectedUnit}
                onBack={goBack}
                onWordMastered={(word) => updateUnitStats(selectedUnit.id, word)}
                onGameFinished={() => updateUnitStats(selectedUnit.id, undefined, true)}
                wordCache={stats.wordCache}
                onUpdateWordCache={updateWordCache}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-neutral-500 text-sm">
            Powered by Gemini AI • Build your vocabulary, one unit at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
