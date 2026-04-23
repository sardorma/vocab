/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BookMarked, ArrowRight, Star } from 'lucide-react';
import { Unit } from '../data/vocabulary.ts';

interface DashboardProps {
  units: Unit[];
  onUnitSelect: (unit: Unit) => void;
  unitStats: Record<number, { masteredWords: string[]; gamesPlayed: number }>;
}

export default function Dashboard({ units, onUnitSelect, unitStats }: DashboardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
          Welcome back, Learner
        </h2>
        <p className="text-lg text-text-secondary max-w-2xl">
          Select a unit to start building your vocabulary. Each unit contains 
          themed words and interactive games to master them.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit, index) => {
          const stats = unitStats[unit.id] || { masteredWords: [], gamesPlayed: 0 };
          const progress = Math.round((stats.masteredWords.length / unit.words.length) * 100);

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onUnitSelect(unit)}
              className="group relative bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-cyan-500/10 hover:shadow-xl hover:border-accent transition-all cursor-pointer overflow-hidden glass-card"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookMarked size={120} className="text-accent rotate-12" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-bg text-accent border border-border uppercase tracking-widest">
                    Unit {unit.id}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-text-secondary">
                    <span className={progress === 100 ? 'text-accent' : ''}>{progress}%</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-text-primary leading-snug group-hover:text-accent transition-colors">
                  {unit.title.split(': ')[1] || unit.title}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                    <span>{stats.masteredWords.length} / {unit.words.length} Mastered</span>
                    <span>{stats.gamesPlayed} Games</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg border border-border rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full bg-accent shadow-[0_0_8px_var(--color-accent)] ${progress === 100 ? 'bg-highlight shadow-[0_0_8px_var(--color-highlight)]' : ''}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <div className="p-2 rounded-full bg-border text-text-secondary group-hover:bg-accent group-hover:text-bg transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 h-1 bg-accent w-0 group-hover:w-full shadow-[0_0_10px_var(--color-accent)] transition-all duration-300" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
