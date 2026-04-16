'use client';

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Mode = 'login' | 'register';

interface Props {
  isOpen: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

const googleProvider = new GoogleAuthProvider();

export default function AuthModal({ isOpen, initialMode = 'login', onClose }: Props) {
  const [mode, setMode]     = useState<Mode>(initialMode);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Поля
  const [nick, setNick]   = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');

  if (!isOpen) return null;

  function reset() {
    setError('');
    setNick('');
    setEmail('');
    setPass('');
  }

  function switchMode(m: Mode) {
    reset();
    setMode(m);
  }

  async function handleLogin() {
    if (!email || !pass) { setError('Заполните все поля'); return; }
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      reset(); onClose();
    } catch (e: any) {
      const codes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
      setError(codes.includes(e.code) ? 'Неверный email или пароль' : 'Ошибка входа');
    } finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!nick)          { setError('Введите никнейм'); return; }
    if (!email)         { setError('Введите email'); return; }
    if (pass.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) { setError('Аккаунт с таким email уже существует'); setLoading(false); return; }

      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: nick });
      await setDoc(doc(db, 'users', cred.user.uid), {
        nickname: nick, email, createdAt: serverTimestamp(),
      });
      reset(); onClose();
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') setError('Аккаунт с таким email уже существует');
      else if (e.code === 'auth/weak-password')   setError('Слишком слабый пароль');
      else setError('Ошибка регистрации');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, 'users', result.user.uid), {
        nickname: result.user.displayName,
        email:    result.user.email,
        createdAt: serverTimestamp(),
      }, { merge: true });
      reset(); onClose();
    } catch { setError('Ошибка входа через Google'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8" onClick={(e) => e.stopPropagation()}>
        {/* Вкладки */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition-colors
                ${mode === m ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              value={nick} onChange={(e) => setNick(e.target.value)}
              placeholder="Никнейм"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          )}
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            value={pass} onChange={(e) => setPass(e.target.value)}
            placeholder="Пароль"
            type="password"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <div className="flex items-center gap-3 text-gray-300 text-xs">
            <div className="flex-1 h-px bg-gray-200" />или<div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3-11.3-7.4l-6.6 4.9C9.8 39.7 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.2 5.2C40.9 36 44 30.4 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
            Войти через Google
          </button>
        </div>
      </div>
    </div>
  );
}
