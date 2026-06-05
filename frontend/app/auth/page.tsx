'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import DateInputDMY from '@/components/DateInputDMY';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
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

import Select, { components } from 'react-select';

import countries from 'i18n-iso-countries';
import ru from 'i18n-iso-countries/langs/ru.json';
countries.registerLocale(ru);

const options = Object.entries(countries.getNames('ru')).map(([code, name]) => ({
    value: code,
    label: name,
}));

type Mode = 'login-nick' | 'login-email' | 'forgot-password' | 'register';

const ValueContainer = ({ children, ...props }: any) => (
    <components.ValueContainer {...props}>
        <img src="/icons/countryauth.svg" className="w-5 h-5 shrink-0 mr-3" />
        {children}
    </components.ValueContainer>
);

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
                ? <img src={icon} className="w-5 h-5 shrink-0 pointer-events-none" />
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

export default function AuthPage() {
    const { t } = useLanguage();
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
    const [phone,      setPhone]      = useState('');
    const [birthDate,  setBirthDate]  = useState('');
    const [nickError,  setNickError]  = useState('');

    function reset() {
        setError(''); setInfo(''); setNickError('');
        setNick(''); setPass(''); setEmail(''); setEmailPass(''); setResetEmail('');
        setRegNick(''); setFullName(''); setRegEmail(''); setRegPass('');
        setCountry(''); setPhone(''); setBirthDate('');
    }
    // Синхронизация URL → mode (при переходе через хедер)
    useEffect(() => {
        const tab = searchParams.get('tab');
        const next: Mode = tab === 'register' ? 'register' : 'login-email';
        setMode(next);
    }, [searchParams]);

    // Синхронизация mode → URL (при клике на таб-кнопки)
    function switchMode(m: Mode) {
        reset();
        setMode(m);
        router.replace(m === 'register' ? '/auth?tab=register' : '/auth', { scroll: false });
    }

    async function handleLoginNick() {
        if (!nick.trim() || !pass) { setError(t.auth.errFillAll); return; }
        setLoading(true); setError('');
        try {
            const userDoc = await findUserByNick(nick.trim());
            if (!userDoc) { setError(t.auth.errUserNotFound); setLoading(false); return; }
            const userData = userDoc.data();
            if (!userData.email) { setError(t.auth.errLogin); setLoading(false); return; }
            await signInWithEmailAndPassword(auth, userData.email, pass);
            router.push('/');
        } catch (e: any) {
            const codes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
            setError(codes.includes(e.code) ? t.auth.errWrongNick : t.auth.errLogin);
        } finally { setLoading(false); }
    }

    async function handleLoginEmail() {
        if (!email || !emailPass) { setError(t.auth.errFillAll); return; }
        setLoading(true); setError('');
        try {
            await signInWithEmailAndPassword(auth, email, emailPass);
            router.push('/');
        } catch (e: any) {
            const codes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
            setError(codes.includes(e.code) ? t.auth.errWrongEmail : t.auth.errLogin);
        } finally { setLoading(false); }
    }

    async function handleForgotPassword() {
        if (!resetEmail) { setError(t.auth.errEnterEmail); return; }
        setLoading(true); setError(''); setInfo('');
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setInfo(`${t.auth.emailSentTo} ${resetEmail}`);
        } catch { setError(t.auth.errEmailCheck); }
        finally { setLoading(false); }
    }

    async function handleGoogle() {
        setLoading(true); setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                router.push('/auth/complete');
            } else {
                router.push('/');
            }
        } catch (e: any) {
            if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
                setError(t.auth.errGoogle);
            }
        } finally { setLoading(false); }
    }

    async function handleRegister() {
        if (!regNick.trim()) { setNickError(t.auth.errEnterUsername); return; }
        if (!fullName)       { setError(t.auth.errEnterFullName); return; }
        if (!regEmail)       { setError(t.auth.errEnterEmail); return; }
        if (regPass.length < 6) { setError(t.auth.errShortPassword); return; }
        if (!country || !birthDate) { setError(t.auth.errFillAll); return; }
        setLoading(true); setError(''); setNickError('');
        try {
            if (!(await isNickUnique(regNick.trim()))) { setNickError(t.auth.errUsernameTaken); setLoading(false); return; }
            const cred = await createUserWithEmailAndPassword(auth, regEmail, regPass);
            await updateProfile(cred.user, { displayName: fullName });
            await setDoc(doc(db, 'users', cred.user.uid), {
                nick: regNick.toLowerCase(), email: regEmail, fullName,
                country, phone: phone || '', birthDate,
                role: 'user', createdAt: serverTimestamp(),
            });
            router.push('/');
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') setError(t.auth.errEmailTaken);
            else if (e.code === 'auth/weak-password')   setError(t.auth.errWeakPassword);
            else setError(t.auth.errRegister);
        } finally { setLoading(false); }
    }

    const isLoginMode = mode === 'login-nick' || mode === 'login-email' || mode === 'forgot-password';

    return (
        <div className="min-h-page flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#C0CEB9' }}>
            <motion.div
                layout
                className="w-full max-w-[540px] bg-white rounded-3xl p-8 md:p-10"
                style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
                transition={{ layout: { type: 'spring', duration: 0.45, bounce: 0.2 } }}
            >

                {/* Табы */}
                <div className="flex rounded-2xl p-1 mb-8" style={{ backgroundColor: '#F0F2EE' }}>
                    <button
                        onClick={() => switchMode('login-email')}
                        className="flex-1 py-3 text-center text-btn-lg rounded-xl transition-all"
                        style={isLoginMode
                            ? { backgroundColor: 'white', color: '#21393B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                            : { color: '#73907E' }}
                    >
                        {t.auth.tabLogin}
                    </button>
                    <button
                        onClick={() => switchMode('register')}
                        className="flex-1 py-3 text-center text-btn-lg rounded-xl transition-all"
                        style={mode === 'register'
                            ? { backgroundColor: 'white', color: '#21393B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                            : { color: '#73907E' }}
                    >
                        {t.auth.tabRegister}
                    </button>
                </div>

                <div style={{ position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="popLayout">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex flex-col gap-5"
                >

                    {/* ── Вход по имени пользователя ── */}
                    {mode === 'login-nick' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>{t.auth.loginNickTitle}</h1>

                            <Field label={t.auth.usernameLbl}>
                                <Input
                                    icon="/icons/nameauth.svg"
                                    placeholder={t.auth.usernamePh}
                                    value={nick}
                                    onChange={(e) => setNick(e.target.value)} />
                            </Field>
                            <Field label={t.auth.passwordLbl}>
                                <Input icon="/icons/passwordauth.svg"
                                       placeholder="········"
                                       type="password"
                                       value={pass}
                                       onChange={(e) => setPass(e.target.value)} />
                            </Field>

                            <div className="flex flex-col gap-1">
                                <button onClick={() => switchMode('login-email')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    {t.auth.loginByEmail}
                                </button>
                                <button onClick={() => switchMode('forgot-password')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    {t.auth.forgotPassword}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Вход по email ── */}
                    {mode === 'login-email' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>{t.auth.loginEmailTitle}</h1>

                            <Field label={t.auth.emailLbl}>
                                <Input
                                    icon="/icons/emailauth.svg"
                                    placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </Field>
                            <Field label={t.auth.passwordLbl}>
                                <Input
                                    icon="/icons/passwordauth.svg"
                                    placeholder="········" type="password" value={emailPass} onChange={(e) => setEmailPass(e.target.value)} />
                            </Field>

                            <div className="flex flex-col gap-1">
                                <button onClick={() => switchMode('login-nick')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    {t.auth.loginByUsername}
                                </button>
                                <button onClick={() => switchMode('forgot-password')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                    {t.auth.forgotPassword}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Восстановление пароля ── */}
                    {mode === 'forgot-password' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>{t.auth.forgotTitle}</h1>
                            <p className="text-body" style={{ color: '#21393B', opacity: 0.6 }}>
                                {t.auth.forgotDesc}
                            </p>

                            <Field label={t.auth.emailLbl}>
                                <Input placeholder="you@example.com" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                            </Field>

                            <button onClick={() => switchMode('login-email')} className="text-left text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                                {t.auth.backToLogin}
                            </button>
                        </>
                    )}

                    {/* ── Регистрация ── */}
                    {mode === 'register' && (
                        <>
                            <h1 className="text-h2" style={{ color: '#21393B' }}>{t.auth.registerTitle}</h1>

                            <Field label={t.auth.usernameLbl}>
                                <div className="flex flex-col gap-1">
                                    <Input
                                        icon="/icons/nameauth.svg"
                                        placeholder={t.auth.usernamePh}
                                        value={regNick}
                                        onChange={(e) => setRegNick(e.target.value)} />
                                    {nickError && <p className="text-caption" style={{ color: '#e53e3e' }}>{nickError}</p>}
                                </div>
                            </Field>
                            <Field label={t.auth.fullNameLbl}>
                                <Input
                                    icon="/icons/nameauth.svg"
                                    placeholder={t.auth.fullNamePh}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)} />
                            </Field>
                            <Field label={t.auth.emailLbl}>
                                <Input
                                    icon ="/icons/emailauth.svg"
                                    placeholder="you@example.com"
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)} />
                            </Field>
                            <Field label={t.auth.passwordLbl}>
                                <Input
                                    icon="/icons/passwordauth.svg"
                                    placeholder={t.auth.passwordPh}
                                    type="password"
                                    value={regPass}
                                    onChange={(e) => setRegPass(e.target.value)} />
                            </Field>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>{t.auth.countryLbl}</label>
                                <Select
                                    instanceId="auth-country"
                                    options={options}
                                    placeholder={t.auth.countryPh}
                                    components={{ ValueContainer }}
                                    onChange={(opt) => setCountry(opt?.label ?? '')}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            border: '1.5px solid #DAE3E8',
                                            borderRadius: '16px',
                                            padding: '0 8px 0 12px',
                                            boxShadow: 'none',
                                            backgroundColor: 'transparent',
                                            minHeight: '54px',
                                            fontSize: 'clamp(15px, 0.8vw + 12px, 17px)',
                                            color: '#21393B',
                                            '&:hover': { borderColor: '#DAE3E8' },
                                        }),
                                        valueContainer: (base) => ({
                                            ...base,
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0 0 0 4px',
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            borderRadius: '16px',
                                            border: '1.5px solid #DAE3E8',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                            overflow: 'hidden',
                                            fontSize: '14px',
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? 'rgba(76,109,124,0.1)' : 'white',
                                            color: '#21393B',
                                            cursor: 'pointer',
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#21393B',
                                            opacity: 0.4,
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#21393B',
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            color: '#21393B',
                                        }),
                                        indicatorSeparator: () => ({ display: 'none' }),
                                        dropdownIndicator: (base) => ({
                                            ...base,
                                            color: 'rgba(33,57,59,0.4)',
                                        }),
                                    }}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>{t.auth.phoneLbl}</label>
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
                                    searchPlaceholder={t.auth.phoneSearch}
                                />
                            </div>

                            <Field label={t.auth.birthDateLbl}>
                                <DateInputDMY value={birthDate} onChange={setBirthDate} />
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
                            : mode === 'login-nick' || mode === 'login-email' ? t.auth.btnLogin
                                : mode === 'forgot-password' ? t.auth.btnSendEmail
                                    : t.auth.btnCreateAccount}
                    </button>

                    {/* Google — только на входе */}
                    {(isLoginMode && mode !== 'forgot-password' || mode === 'register') && (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px" style={{ backgroundColor: '#DAE3E8' }} />
                                <span className="text-caption" style={{ color: '#73907E' }}>{t.auth.or}</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: '#DAE3E8' }} />
                            </div>
                            <button
                                onClick={handleGoogle}
                                disabled={loading}
                                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 text-btn transition-colors disabled:opacity-50 hover:bg-gray-50"
                                style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                            >
                                <GoogleIcon />
                                {mode === 'register' ? t.auth.btnGoogleRegister : t.auth.btnGoogleLogin}
                            </button>
                        </>
                    )}

                    {/* Переключатель внизу */}
                    <p className="text-center text-body" style={{ color: '#21393B', opacity: 0.6 }}>
                        {isLoginMode ? (
                            <>{t.auth.noAccount}{' '}
                                <button onClick={() => switchMode('register')} className="font-medium" style={{ color: '#4C6D7C' }}>
                                    {t.auth.signUpLink}
                                </button>
                            </>
                        ) : (
                            <>{t.auth.haveAccount}{' '}
                                <button onClick={() => switchMode('login-email')} className="font-medium" style={{ color: '#4C6D7C' }}>
                                    {t.auth.signInLink}
                                </button>
                            </>
                        )}
                    </p>

                </motion.div>
                </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}