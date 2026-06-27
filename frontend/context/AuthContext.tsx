'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const PROFILE_KEY = 'kmt_profile';
function readCache(): UserProfile | null {
  try { const r = localStorage.getItem(PROFILE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function writeCache(p: UserProfile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}
function clearCache() {
  try { localStorage.removeItem(PROFILE_KEY); } catch {}
}

export type UserRole = 'admin' | 'consultant' | 'user';

export type PendingNotification = {
  type: 'consultant_approved' | 'consultant_rejected';
  seenAt: null;
} | null;

export interface UserProfile {
  uid:       string;
  nick:      string;
  email:     string;
  fullName:  string;
  country:   string;
  city:      string;
  phone:     string;
  birthDate: string;
  createdAt: string;
  role:      UserRole;
  pendingNotification?: PendingNotification;
  quizResult?: {
    topHospitalIds:   string[];
    topHospitalNames: string[];
    matchPercents:    number[];
    savedAt:          string;
  };
}

interface AuthContextType {
  user:           User | null;
  profile:        UserProfile | null;
  role:           UserRole | null;
  registered:     boolean;
  loading:        boolean;
  refreshProfile: (forUser?: User) => Promise<void>;
  patchProfile:   (patch: Partial<UserProfile>) => void;
}


const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, role: null,
  registered: false, loading: true,
  refreshProfile: async () => {},
  patchProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [role,       setRole]       = useState<UserRole | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading,    setLoading]    = useState(true);

  async function loadProfile(firebaseUser: User) {
    // Custom Claims из токена — именно их читают Firestore Rules (request.auth.token.role)
    const tokenResult = await firebaseUser.getIdTokenResult();
    const claimRole = tokenResult.claims['role'] as UserRole | undefined;

    const privileged = claimRole;
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (snap.exists()) {
      const data = snap.data();
      const resolvedRole: UserRole = privileged ?? (data.role as UserRole) ?? 'user';
      const fresh: UserProfile = {
        uid:                 firebaseUser.uid,
        nick:                data.nick ?? data.nickname ?? '',
        email:               firebaseUser.email ?? '',
        fullName:            data.fullName ?? data.nickname ?? firebaseUser.displayName ?? '',
        country:             data.country   ?? '',
        city:                data.city      ?? '',
        phone:               data.phone     ?? '',
        birthDate:           data.birthDate ?? '',
        createdAt:           data.createdAt ?? '',
        role:                resolvedRole,
        pendingNotification: data.pendingNotification ?? null,
        quizResult:          data.quizResult          ?? undefined,
      };
      setProfile(fresh);
      writeCache(fresh);
      setRole(resolvedRole);
      setRegistered(true);
    } else if (privileged) {
      const fresh: UserProfile = {
        uid: firebaseUser.uid, nick: '',
        email: firebaseUser.email ?? '',
        fullName: firebaseUser.displayName ?? firebaseUser.email ?? '',
        country: '', city: '', phone: '', birthDate: '', createdAt: '',
        role: privileged,
      };
      setProfile(fresh);
      writeCache(fresh);
      setRole(privileged);
      setRegistered(true);
    } else {
      setProfile(null);
      setRole(null);
      setRegistered(false);
    }
  }

  const refreshProfile = async (forUser?: User) => {
    const target = forUser ?? user;
    if (target) await loadProfile(target);
  };

  function patchProfile(patch: Partial<UserProfile>) {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      writeCache(updated);
      return updated;
    });
  }

  // Show cached profile instantly on first paint
  useEffect(() => {
    const cached = readCache();
    if (cached) setProfile(cached);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
        setRole(null);
        setRegistered(false);
        clearCache();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const contextValue = useMemo(
      () => ({ user, profile, role, registered, loading, refreshProfile, patchProfile }),
      [user, profile, role, registered, loading]
  );

  return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}