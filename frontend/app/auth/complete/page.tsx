'use client';

import { useState, useEffect, Suspense } from 'react';
import DateInputDMY from '@/components/DateInputDMY';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { acceptConsultantInvite } from '@/lib/firebase-consultations';
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

function capitalize(v: string) { return v.charAt(0).toUpperCase() + v.slice(1); }

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
            {icon && <img src={icon} className="w-5 h-5 shrink-0 pointer-events-none" />}
            <input
                {...props}
                className="flex-1 text-body outline-none bg-transparent"
                style={{ color: '#21393B' }}
            />
        </div>
    );
}

// ── Форма принятия инвайта консультанта ──────────────────────────────────────
function InviteForm({ token }: { token: string }) {
    const router = useRouter();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteValid, setInviteValid] = useState<boolean | null>(null);
    const [inviteError, setInviteError] = useState('');
    const [fullName,    setFullName]    = useState('');
    const [password,    setPassword]    = useState('');
    const [confirm,     setConfirm]     = useState('');
    const [loading,     setLoading]     = useState(false);
    const [formError,   setFormError]   = useState('');

    useEffect(() => {
        getDoc(doc(db, 'consultantInvites', token)).then((snap) => {
            if (!snap.exists()) { setInviteValid(false); setInviteError('Инвайт не найден.'); return; }
            const d = snap.data();
            if (d.used) { setInviteValid(false); setInviteError('Этот инвайт уже был использован.'); return; }
            if (new Date(d.expiresAt as string) < new Date()) {
                setInviteValid(false);
                setInviteError('Срок действия инвайта истёк. Попросите администратора отправить новый.');
                return;
            }
            setInviteEmail(d.email as string);
            setInviteValid(true);
        }).catch(() => { setInviteValid(false); setInviteError('Не удалось проверить инвайт.'); });
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');
        if (!fullName.trim())   { setFormError('Введите имя'); return; }
        if (password.length < 6) { setFormError('Пароль — минимум 6 символов'); return; }
        if (password !== confirm) { setFormError('Пароли не совпадают'); return; }
        setLoading(true);
        try {
            await acceptConsultantInvite(token, password, fullName.trim());
            router.replace('/consultant-panel');
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Ошибка. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    }

    if (inviteValid === null) {
        return (
            <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: '#F7FAE8' }}>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#73907E', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    if (!inviteValid) {
        return (
            <div className="min-h-dvh flex items-center justify-center px-4" style={{ backgroundColor: '#F7FAE8' }}>
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEE2E2' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="font-semibold text-base mb-2" style={{ color: '#21393B' }}>Ссылка недействительна</p>
                    <p className="text-sm opacity-60" style={{ color: '#21393B' }}>{inviteError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#F7FAE8' }}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full">
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2D4A3E' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="font-bold text-xl mb-1" style={{ color: '#21393B' }}>Вы приглашены</h1>
                    <p className="text-sm opacity-60" style={{ color: '#21393B' }}>Регистрация консультанта Smart K-Medi</p>
                </div>

                <div className="mb-4 px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: '#F0F4F0' }}>
                    <span className="opacity-50 text-xs block mb-0.5">Email</span>
                    <span className="font-medium" style={{ color: '#21393B' }}>{inviteEmail}</span>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs opacity-60 mb-1 block" style={{ color: '#21393B' }}>Ваше имя</label>
                        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                            placeholder="Иван Иванов" autoComplete="name"
                            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                            style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }} />
                    </div>
                    <div>
                        <label className="text-xs opacity-60 mb-1 block" style={{ color: '#21393B' }}>Пароль</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Минимум 6 символов" autoComplete="new-password"
                            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                            style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }} />
                    </div>
                    <div>
                        <label className="text-xs opacity-60 mb-1 block" style={{ color: '#21393B' }}>Повторите пароль</label>
                        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Повторите пароль" autoComplete="new-password"
                            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                            style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }} />
                    </div>
                    {formError && <p className="text-xs text-red-500 px-1">{formError}</p>}
                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white mt-1 disabled:opacity-50"
                        style={{ backgroundColor: '#21393B' }}>
                        {loading ? 'Регистрация...' : 'Завершить регистрацию'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Роутер: инвайт или завершение Google-профиля ─────────────────────────────
function CompleteRegistrationInner() {
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');
    if (inviteToken) return <InviteForm token={inviteToken} />;
    return <ProfileCompleteForm />;
}

export default function CompleteRegistrationPage() {
    return (
        <Suspense>
            <CompleteRegistrationInner />
        </Suspense>
    );
}

// ── Завершение профиля после Google-входа ────────────────────────────────────
function ProfileCompleteForm() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const router = useRouter();

    const [nick,      setNick]      = useState('');
    const [fullName,  setFullName]  = useState('');
    const [country,   setCountry]   = useState('');
    const [phone,     setPhone]     = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [nickError, setNickError] = useState('');
    const [error,     setError]     = useState('');
    const [saving,    setSaving]    = useState(false);

    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
        if (!loading && profile) router.replace('/');
    }, [loading, user, profile]);

    useEffect(() => {
        if (user?.displayName) setFullName(user.displayName);
        if (user?.email) {
            const base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
            setNick(base);
        }
    }, [user]);

    async function handleSubmit() {
        if (!nick.trim())     { setNickError('Введите имя пользователя'); return; }
        if (!fullName.trim()) { setError('Введите полное имя'); return; }
        if (!country.trim())  { setError('Введите страну'); return; }
        if (!birthDate)       { setError('Введите дату рождения'); return; }

        setSaving(true); setError(''); setNickError('');
        try {
            if (!(await isNickUnique(nick.trim()))) {
                setNickError('Имя пользователя уже занято');
                setSaving(false);
                return;
            }
            await setDoc(doc(db, 'users', user!.uid), {
                nick:      nick.toLowerCase().trim(),
                email:     user!.email ?? '',
                fullName:  fullName.trim(),
                country:   country.trim(),
                city:      '',
                phone:     phone || '',
                birthDate,
                role:      'user',
                createdAt: serverTimestamp(),
                googleAuth: true,
            });
            await refreshProfile();
            router.push('/');
        } catch (err) {
            console.error('handleSubmit error:', err);
            setError('Ошибка сохранения, попробуйте снова');
        } finally {
            setSaving(false);
        }
    }

    if (loading || !user) {
        return (
            <div className="min-h-page flex items-center justify-center" style={{ backgroundColor: '#C0CEB9' }}>
                <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: '#73907E', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    return (
        <div className="min-h-page flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#C0CEB9' }}>
            <div className="w-full max-w-[540px] bg-white rounded-3xl p-8 md:p-10" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>

                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-h2" style={{ color: '#21393B' }}>Завершите регистрацию</h1>
                    <p className="text-body" style={{ color: '#21393B', opacity: 0.6 }}>
                        Вы вошли через Google. Заполните несколько полей чтобы завершить создание аккаунта.
                    </p>
                </div>

                <div className="flex flex-col gap-5">

                    <Field label="Имя пользователя">
                        <div className="flex flex-col gap-1">
                            <Input
                                icon="/icons/nameauth.svg"
                                placeholder="Имя_пользователя"
                                value={nick}
                                onChange={(e) => { setNick(e.target.value); setNickError(''); }}
                            />
                            {nickError && <p className="text-caption" style={{ color: '#e53e3e' }}>{nickError}</p>}
                        </div>
                    </Field>

                    <Field label="Полное имя">
                        <Input
                            icon="/icons/nameauth.svg"
                            placeholder="Иван Петров"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </Field>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>Страна</label>
                                <Select
                                    instanceId="complete-country"
                                    options={options}
                                    placeholder="Выберите страну..."
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
                        <DateInputDMY value={birthDate} onChange={setBirthDate} />
                    </Field>

                    {error && <p className="text-caption" style={{ color: '#e53e3e' }}>{error}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full py-4 rounded-2xl text-btn-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#73907E' }}
                    >
                        {saving ? 'Сохранение...' : 'Завершить регистрацию'}
                    </button>

                </div>
            </div>
        </div>
    );
}