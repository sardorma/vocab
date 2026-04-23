import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Trophy, Sparkles, ChevronLeft, 
  Gamepad2, Brain, Languages, LogOut, User as UserIcon, 
  CheckCircle2, Settings, GraduationCap, X 
} from 'lucide-react';
import { units, Unit } from './data/vocabulary.ts';
import Dashboard from './components/Dashboard.tsx';
import UnitDetail from './components/UnitDetail.tsx';
import SpellingSprint from './components/games/SpellingSprint.tsx';
import WordScramble from './components/games/WordScramble.tsx';
import Hangman from './components/games/Hangman.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { db } from './lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, increment, getDoc, serverTimestamp } from 'firebase/firestore';

type View = 'dashboard' | 'unitDetail' | 'spelling' | 'scramble' | 'hangman';

interface UnitStats {
  masteredWords: string[];
  gamesPlayed: number;
}

export default function StudentApp() {
  const { user, profile, loading, signIn, logout, joinTeacherByCode } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitStats, setUnitStats] = useState<Record<number, UnitStats>>({});
  const [wordCache, setWordCache] = useState<Record<string, any>>({});
  const [joinCode, setJoinCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signIn();
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnitStats({});
      return;
    }
    const unsubscribes: (() => void)[] = [];
    units.forEach(unit => {
      const uRef = doc(db, 'users', user.uid, 'stats', `unit_${unit.id}`);
      const unsub = onSnapshot(uRef, (snap) => {
        if (snap.exists()) {
          setUnitStats(prev => ({ ...prev, [unit.id]: snap.data() as UnitStats }));
        }
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(u => u());
  }, [user]);

  const updateWordCache = async (word: string, info: { definition: string; hint: string; uz: string; ru: string }) => {
    setWordCache(prev => ({ ...prev, [word.toLowerCase()]: info }));
    try {
      await setDoc(doc(db, 'word_cache', word.toLowerCase()), { ...info, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error("Cache error:", e);
    }
  };

  const updateUnitStatsInFirebase = async (unitId: number, masteredWord?: string, gameFinished?: boolean) => {
    if (!user) return;
    const uRef = doc(db, 'users', user.uid, 'stats', `unit_${unitId}`);
    const docSnap = await getDoc(uRef);
    if (!docSnap.exists()) {
      await setDoc(uRef, {
        masteredWords: masteredWord ? [masteredWord] : [],
        gamesPlayed: gameFinished ? 1 : 0,
        updatedAt: serverTimestamp()
      });
    } else {
      const updateData: any = { updatedAt: serverTimestamp() };
      if (masteredWord) updateData.masteredWords = arrayUnion(masteredWord);
      if (gameFinished) updateData.gamesPlayed = increment(1);
      await updateDoc(uRef, updateData);
    }
  };

  const handleJoinTeacher = async () => {
    try {
      setError(null);
      await joinTeacherByCode(joinCode);
      setJoinCode(''); // Clear input
      alert("Teacher joined successfully!");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const totalMastered = (Object.values(unitStats) as UnitStats[]).reduce((acc, curr) => acc + (curr.masteredWords?.length || 0), 0);
  const totalGames = (Object.values(unitStats) as UnitStats[]).reduce((acc, curr) => acc + (curr.gamesPlayed || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center text-bg mx-auto shadow-2xl">
            <Languages size={40} />
          </div>
          <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">LingoLift</h1>
          <p className="text-text-secondary font-medium italic">Student Edition</p>
        </div>
        <button 
          onClick={handleSignIn} 
          disabled={isLoggingIn}
          className="px-8 py-4 bg-surface border-2 border-border rounded-2xl font-bold flex items-center gap-3 hover:bg-bg transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          )}
          {isLoggingIn ? 'Redirecting...' : 'Sign in to Learn'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans text-text-primary">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => { setCurrentView('dashboard'); setSelectedUnit(null); }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-xl sm:rounded-2xl flex items-center justify-center text-bg shadow-xl shadow-accent/20">
              <Languages size={20} className="sm:hidden" />
              <Languages size={28} className="hidden sm:block" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-xl font-black tracking-tight text-text-primary uppercase leading-tight">
                LingoLift <span className="text-accent hidden sm:inline">Student</span>
              </h1>
              <p className="text-[8px] sm:text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Ready to learn?</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-8">
            <div className="flex items-center gap-2 sm:gap-8 text-sm font-bold text-text-secondary uppercase tracking-widest shrink-0">
               <div className="flex flex-col items-end sm:items-center">
                 <span className="hidden lg:block text-[10px] opacity-50">Mastery</span>
                 <div className="flex items-center gap-1 text-text-primary">
                   <Brain size={14} className="text-accent sm:size-4" />
                   <span className="text-xs sm:text-base">{totalMastered}</span>
                 </div>
               </div>
               <div className="flex flex-col items-end sm:items-center">
                 <span className="hidden lg:block text-[10px] opacity-50">Activity</span>
                 <div className="flex items-center gap-1 text-text-primary">
                   <Gamepad2 size={14} className="text-highlight sm:size-4" />
                   <span className="text-xs sm:text-base">{totalGames}</span>
                 </div>
               </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-12 h-12 bg-surface border-2 border-border rounded-2xl flex items-center justify-center hover:border-accent hover:scale-105 transition-all shadow-lg overflow-hidden group"
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={24} className="group-hover:text-accent transition-colors" />
                )}
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-[280px] xs:w-72 bg-surface border-4 border-border rounded-3xl shadow-2xl p-6 z-50 glass-card"
                  >
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors p-2 z-10"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-border pt-2">
                          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent"><UserIcon size={16} /></div>
                          <p className="text-xs font-bold text-text-primary truncate max-w-[160px]">{user.displayName}</p>
                        </div>
                        
                        <button onClick={logout} className="w-full py-3 bg-highlight/10 text-highlight border border-highlight/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-highlight/20 transition-all">
                          <LogOut size={14} /> Log Out
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 sm:pt-20 pb-24">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Dashboard units={units} onUnitSelect={(u) => { setSelectedUnit(u); setCurrentView('unitDetail'); }} unitStats={unitStats} userName={profile?.displayName?.split(' ')[0]} /></motion.div>}
          {currentView === 'unitDetail' && selectedUnit && <motion.div key="unitDetail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><UnitDetail unit={selectedUnit} onBack={() => setCurrentView('dashboard')} onStartGame={setCurrentView} masteredWords={unitStats[selectedUnit.id]?.masteredWords || []} gamesPlayed={unitStats[selectedUnit.id]?.gamesPlayed || 0} wordCache={wordCache} onUpdateWordCache={updateWordCache} /></motion.div>}
          {['spelling', 'scramble', 'hangman'].includes(currentView) && selectedUnit && (
             <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {currentView === 'spelling' && <SpellingSprint unit={selectedUnit} onBack={() => setCurrentView('unitDetail')} onWordMastered={(word) => updateUnitStatsInFirebase(selectedUnit.id, word)} onGameFinished={() => updateUnitStatsInFirebase(selectedUnit.id, undefined, true)} wordCache={wordCache} onUpdateWordCache={updateWordCache} />}
                {currentView === 'scramble' && <WordScramble unit={selectedUnit} onBack={() => setCurrentView('unitDetail')} onWordMastered={(word) => updateUnitStatsInFirebase(selectedUnit.id, word)} onGameFinished={() => updateUnitStatsInFirebase(selectedUnit.id, undefined, true)} wordCache={wordCache} onUpdateWordCache={updateWordCache} />}
                {currentView === 'hangman' && <Hangman unit={selectedUnit} onBack={() => setCurrentView('unitDetail')} onWordMastered={(word) => updateUnitStatsInFirebase(selectedUnit.id, word)} onGameFinished={() => updateUnitStatsInFirebase(selectedUnit.id, undefined, true)} wordCache={wordCache} onUpdateWordCache={updateWordCache} />}
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
