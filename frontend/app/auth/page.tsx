'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import {
    doc, setDoc, getDoc, serverTimestamp,
    query, collection, where, getDocs,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

type Mode = 'login-nick' | 'login-email' | 'forgot-password' | 'register';

const ADMIN_EMAILS      = ['yeah.sir.228@gmail.com'];
const CONSULTANT_EMAILS = ['kola.molatilek2008@gmail.com'];
function isPrivileged(email: string) {
    return ADMIN_EMAILS.includes(email) || CONSULTANT_EMAILS.includes(email);
}
async function isNickUnique(nick: string) {
    const q = query(collection(db, 'users'), where('nick', '==', nick.toLowerCase()));
    return (await getDocs(q)).empty;
}
async function findUserByNick(nick: string) {
    const q = query(collection(db, 'users'), where('nick', '==', nick.toLowerCase()));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0];
}

const googleProvider = new GoogleAuthProvider();

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-label" style={{ color: '#21393B' }}>{label}</label>
            {children}
        </div>
    );
}

function Input({ icon, ...props }: { icon?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ border: '1.5px solid #DAE3E8' }}>
            {icon
                ? <img src={icon} className="w-5 h-5 shrink-0" />
                : <div className="w-5 h-5 rounded bg-gray-200 shrink-0" />
            }
            <input
                {...props}
                className="flex-1 text-body outline-none bg-transparent"
                style={{ color: '#21393B' }}
            />
        </div>
    );
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<Mode>(
        searchParams.get('tab') === 'register' ? 'register' : 'login-email'
    );
    const [error,   setError]   = useState('');
    const [info,    setInfo]    = useState('');
    const [loading, setLoading] = useState(false);

    // Login fields
    const [nick,       setNick]       = useState('');
    const [pass,       setPass]       = useState('');
    const [email,      setEmail]      = useState('');
    const [emailPass,  setEmailPass]  = useState('');
    const [resetEmail, setResetEmail] = useState('');

    // Register fields
    const [regNick,    setRegNick]    = useState('');
    const [fullName,   setFullName]   = useState('');
    const [regEmail,   setRegEmail]   = useState('');
    const [regPass,    setRegPass]    = useState('');
    const [country,    setCountry]    = useState('');
    const [city,       setCity]       = useState('');
    const [phone,      setPhone]      = useState('');
    const [birthDate,  setBirthDate]  = useState('');
    const [nickError,  setNickError]  = useState('');

    function reset() {
        setError(''); setInfo(''); setNickError('');
        setNick(''); setPass(''); setEmail(''); setEmailPass(''); setResetEmail('');
        setRegNick(''); setFullName(''); setRegEmail(''); setRegPass('');
        setCountry(''); setCity(''); setPhone(''); setBirthDate('');
    }
    function switchMode(m: Mode) { reset(); setMode(m); }

    async function handleLoginNick() {
        if (!nick.trim() || !pass) { setError('Заполните все поля'); return; }
        setLoading(true); setError('');
        try {
            const userDoc = await findUserByNick(nick.trim());
            if (!userDoc) { setError('Пользователь с таким именем не найден'); setLoading(false); return; }
            const userData = userDoc.data();
            if (!userData.email) { setError('Ошибка входа'); setLoading(false); return; }
            const cred = await signInWithEmailAndPassword(auth, userData.email, pass);
            if (!isPrivileged(cred.user.email ?? '')) {
                const snap = await getDoc(doc(db, 'users', cred.user.uid));
                if (!snap.exists()) { await signOut(auth); setError('Аккаунт не найден'); return; }
            }
            router.push('/');
        } catch (e: any) {
            const codes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
            setError(codes.includes(e.code) ? 'Неверное имя пользователя или пароль' : 'Ошибка входа');
        } finally { setLoading(false); }
    }

    async function handleLoginEmail() {
        if (!email || !emailPass) { setError('Заполните все поля'); return; }
        setLoading(true); setError('');
        try {
            const cred = await signInWithEmailAndPassword(auth, email, emailPass);
            if (!isPrivileged(cred.user.email ?? '')) {
                const snap = await getDoc(doc(db, 'users', cred.user.uid));
                if (!snap.exists()) { await signOut(auth); setError('Аккаунт не найден'); return; }
            }
            router.push('/');
        } catch (e: any) {
            const codes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
            setError(codes.includes(e.code) ? 'Неверный email или пароль' : 'Ошибка входа');
        } finally { setLoading(false); }
    }

    async function handleForgotPassword() {
        if (!resetEmail) { setError('Введите email'); return; }
        setLoading(true); setError(''); setInfo('');
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setInfo(`Письмо отправлено на ${resetEmail}`);
        } catch { setError('Ошибка. Проверьте email'); }
        finally { setLoading(false); }
    }

    async function handleGoogle() {
        setLoading(true); setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                const baseNick = user.displayName?.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0] || 'user';
                let finalNick = baseNick; let counter = 1;
                while (!(await isNickUnique(finalNick))) { finalNick = `${baseNick}_${counter}`; counter++; }
                await setDoc(doc(db, 'users', user.uid), {
                    nick: finalNick, email: user.email || '',
                    fullName: user.displayName || '', country: '', city: '',
                    phone: '', birthDate: '', role: 'user',
                    createdAt: serverTimestamp(), googleAuth: true,
                });
            }
            router.push('/');
        } catch (e: any) {
            if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
                setError('Ошибка входа через Google');
            }
        } finally { setLoading(false); }
    }

    async function handleRegister() {
        if (!regNick.trim()) { setNickError('Введите имя пользователя'); return; }
        if (!fullName)       { setError('Введите полное имя'); return; }
        if (!regEmail)       { setError('Введите email'); return; }
        if (regPass.length < 6) { setError('Пароль минимум 6 символов'); return; }
        if (!country || !city || !birthDate) { setError('Заполните все поля'); return; }
        setLoading(true); setError(''); setNickError('');
        try {
            if (!(await isNickUnique(regNick.trim()))) { setNickError('Имя пользователя уже занято'); setLoading(false); return; }
            const cred = await createUserWithEmailAndPassword(auth, regEmail, regPass);
            await updateProfile(cred.user, { displayName: fullName });
            await setDoc(doc(db, 'users', cred.user.uid), {
                nick: regNick.toLowerCase(), email: regEmail, fullName,
                country, city, phone: phone || '', birthDate,
                role: 'user', createdAt: serverTimestamp(),
            });
            router.push('/');
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') setError('Email уже используется');
            else if (e.code === 'auth/weak-password')   setError('Слишком слабый пароль');
            else setError('Ошибка регистрации');
        } finally { setLoading(false); }
    }

    const isLoginMode = mode === 'login-nick' || mode === 'login-email' || mode === 'forgot-password';

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F7FAE8' }}>
            <div className="w-full max-w-[540px] bg-white rounded-3xl p-8 md:p-10" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>

                {/* Табы */}
                <div className="flex rounded-2xl p-1 mb-8" style={{ backgroundColor: '#F0F2EE' }}>
                    <button
                        onClick={() => switchMode('login-email')}
                        className="flex-1 py-3 text-center text-btn-lg rounded-xl transition-all"
                        style={isLoginMode
                            ? { backgroundColor: 'white', color: '#21393B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                            : { color: '#73907E' }}
                    >
                        Войти
                    </button>
                    <button
                        onClick={() => switchMode('register')}
                        className="flex-1 py-3 text-center text-btn-lg rounded-xl transition-all"
                        style={mode === 'register'
                            ? { backgroundColor: 'white', color: '#21393B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                            : { color: '#73907E' }}
                    >
                        Зарегистрироваться
                    </button>
                </div>

                <div className="flex flex-col gap-5">

                    {/* ── Вход по имени пользователя ── */}
                    {mode === 'login-nick' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>Войдите в аккаунт</h1>

                            <Field label="Имя пользователя">
                                <Input
                                    icon="/icons/nameauth.svg"
                                    placeholder="Имя_пользователя"
                                    value={nick}
                                    onChange={(e) => setNick(e.target.value)} />
                            </Field>
                            <Field label="Пароль">
                                <Input icon="/icons/passwordauth.svg"
                                       placeholder="········"
                                       type="password"
                                       value={pass}
                                       onChange={(e) => setPass(e.target.value)} />
                            </Field>

                            <div className="flex flex-col gap-1">
                                <button onClick={() => switchMode('login-email')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    Войти по почте
                                </button>
                                <button onClick={() => switchMode('forgot-password')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    Забыли пароль?
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Вход по email ── */}
                    {mode === 'login-email' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>Войдите по email</h1>

                            <Field label="Электронная почта">
                                <Input
                                    icon="/icons/emailauth.svg"
                                    placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </Field>
                            <Field label="Пароль">
                                <Input
                                    icon="/icons/passwordauth.svg"
                                    placeholder="········" type="password" value={emailPass} onChange={(e) => setEmailPass(e.target.value)} />
                            </Field>

                            <div className="flex flex-col gap-1">
                                <button onClick={() => switchMode('login-nick')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    Войти по имени пользователя
                                </button>
                                <button onClick={() => switchMode('forgot-password')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    Забыли пароль?
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Восстановление пароля ── */}
                    {mode === 'forgot-password' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>Восстановление пароля</h1>
                            <p className="text-body" style={{ color: '#21393B', opacity: 0.6 }}>
                                Введите email — мы отправим ссылку для сброса пароля
                            </p>

                            <Field label="Электронная почта">
                                <Input placeholder="you@example.com" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                            </Field>

                            <button onClick={() => switchMode('login-email')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                Вернуться ко входу
                            </button>
                        </>
                    )}

                    {/* ── Регистрация ── */}
                    {mode === 'register' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>Создать аккаунт</h1>

                            <Field label="Имя пользователя">
                                <div className="flex flex-col gap-1">
                                    <Input
                                        icon="/icons/nameauth.svg"
                                        placeholder="Имя_пользователя"
                                        value={regNick}
                                        onChange={(e) => setRegNick(e.target.value)} />
                                        {nickError && <p className="text-caption" style={{ color: '#e53e3e' }}>{nickError}</p>}
                                </div>
                            </Field>
                            <Field label="Полное имя">
                                <Input
                                    icon="/icons/nameauth.svg"
                                    placeholder="Сергей Лебедев"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)} />
                            </Field>
                            <Field label="Электронная почта">
                                <Input
                                    icon ="/icons/emailauth.svg"
                                    placeholder="you@example.com"
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)} />
                            </Field>
                            <Field label="Пароль">
                                <Input
                                    icon="/icons/passwordauth.svg"
                                    placeholder="Минимум 6 символов"
                                    type="password"
                                    value={regPass}
                                    onChange={(e) => setRegPass(e.target.value)} />
                            </Field>

                            <Field label="Страна">
                                <Input
                                    icon ="/icons/countryauth.svg"
                                    placeholder="Страна"
                                    value={country}
                                    onChange={(e) => setCountry(capitalize(e.target.value))}
                                />
                            </Field>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>Телефон (необязательно)</label>
                                <PhoneInput
                                    country="ru"
                                    value={phone}
                                    onChange={(value) => setPhone('+' + value)}
                                    inputStyle={{
                                        width: '100%',
                                        border: '1.5px solid #DAE3E8',
                                        borderRadius: '16px',
                                        padding: '14px 14px 14px 62px',
                                        fontSize: 'clamp(15px, 0.8vw + 12px, 17px)',
                                        color: '#21393B',
                                        backgroundColor: 'transparent',
                                        outline: 'none',
                                        boxShadow: 'none',
                                        height: '54px',
                                    }}
                                    buttonStyle={{
                                        border: 'none',
                                        borderRight: '1.5px solid #DAE3E8',
                                        borderRadius: '16px 0 0 16px',
                                        backgroundColor: 'transparent',
                                        padding: '0 8px',
                                    }}
                                    dropdownStyle={{
                                        borderRadius: '16px',
                                        border: '1.5px solid #DAE3E8',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                        color: '#21393B',
                                        fontSize: '14px',
                                    }}
                                    searchStyle={{
                                        borderRadius: '8px',
                                        border: '1.5px solid #DAE3E8',
                                        padding: '6px 10px',
                                        fontSize: '14px',
                                        color: '#21393B',
                                        width: '90%',
                                    }}
                                    enableSearch
                                    searchPlaceholder="Поиск страны..."
                                />
                            </div>

                            <Field label="Дата рождения">
                                <Input
                                    icon="/icons/dateauth.svg"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)} />
                            </Field>
                        </>
                    )}

                    {error && <p className="text-caption" style={{ color: '#e53e3e' }}>{error}</p>}
                    {info  && <p className="text-caption" style={{ color: '#4C6D7C' }}>{info}</p>}

                    {/* Основная кнопка */}
                    <button
                        onClick={
                            mode === 'login-nick'      ? handleLoginNick
                                : mode === 'login-email'   ? handleLoginEmail
                                    : mode === 'forgot-password' ? handleForgotPassword
                                        : handleRegister
                        }
                        disabled={loading}
                        className="w-full py-4 rounded-2xl text-btn-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#73907E' }}
                    >
                        {loading ? '...'
                            : mode === 'login-nick' || mode === 'login-email' ? 'Войти'
                                : mode === 'forgot-password' ? 'Отправить письмо'
                                    : 'Создать аккаунт'}
                    </button>

                    {/* Google — только на входе */}
                    {isLoginMode && mode !== 'forgot-password' && (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px" style={{ backgroundColor: '#DAE3E8' }} />
                                <span className="text-caption" style={{ color: '#73907E' }}>или</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: '#DAE3E8' }} />
                            </div>
                            <button
                                onClick={handleGoogle}
                                disabled={loading}
                                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 text-btn transition-colors disabled:opacity-50 hover:bg-gray-50"
                                style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                            >
                                <GoogleIcon />
                                Войти через Google
                            </button>
                        </>
                    )}

                    {/* Переключатель внизу */}
                    <p className="text-center text-body" style={{ color: '#21393B', opacity: 0.6 }}>
                        {isLoginMode ? (
                            <>Нет аккаунта?{' '}
                                <button onClick={() => switchMode('register')} className="font-medium" style={{ color: '#4C6D7C' }}>
                                    Зарегистрируйтесь
                                </button>
                            </>
                        ) : (
                            <>Уже есть аккаунт?{' '}
                                <button onClick={() => switchMode('login-email')} className="font-medium" style={{ color: '#4C6D7C' }}>
                                    Войти
                                </button>
                            </>
                        )}
                    </p>

                </div>
            </div>
        </div>
    );
}