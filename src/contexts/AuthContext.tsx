import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'teacher';
  teacherCode?: string; // Their own code if teacher
  joinedTeacherId?: string; // UID of the teacher they joined
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  registerAsTeacher: (code: string) => Promise<void>;
  joinTeacherByCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const currentProfile = docSnap.data() as UserProfile;
          // Refresh profile data if name or photo changed in Google
          if (currentProfile.displayName !== user.displayName || currentProfile.photoURL !== user.photoURL) {
            const updated = { ...currentProfile, displayName: user.displayName || currentProfile.displayName, photoURL: user.photoURL || undefined };
            await setDoc(docRef, updated, { merge: true });
            setProfile(updated);
          } else {
            setProfile(currentProfile);
          }
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || undefined,
            role: 'student'
          };
          await setDoc(docRef, { ...newProfile, createdAt: serverTimestamp() });
          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User closed the popup or a previous one was cancelled - this is fine
        console.log("Sign-in popup closed or cancelled.");
      } else {
        console.error("Sign-in error:", error);
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const registerAsTeacher = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error("Code required");

    const codeRef = doc(db, 'teacher_codes', cleanCode);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      throw new Error("This code is already taken");
    }

    // Use a batch or multiple writes
    // 1. Mark user as teacher
    await setDoc(doc(db, 'users', user.uid), { 
      role: 'teacher', 
      teacherCode: cleanCode 
    }, { merge: true });
    
    // 2. Reserve the code
    await setDoc(codeRef, { userId: user.uid });

    setProfile(prev => prev ? { ...prev, role: 'teacher', teacherCode: cleanCode } : null);
  };

  const joinTeacherByCode = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    const codeRef = doc(db, 'teacher_codes', cleanCode);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      throw new Error("Teacher not found");
    }

    const teacherUID = codeSnap.data().userId;
    await setDoc(doc(db, 'users', user.uid), { 
      joinedTeacherId: teacherUID 
    }, { merge: true });

    setProfile(prev => prev ? { ...prev, joinedTeacherId: teacherUID } : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, registerAsTeacher, joinTeacherByCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
