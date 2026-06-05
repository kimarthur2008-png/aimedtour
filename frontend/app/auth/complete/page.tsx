'use client';

import { useState, useEffect } from 'react';
import DateInputDMY from '@/components/DateInputDMY';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
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

export default function CompleteRegistrationPage() {
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
        } catch {
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