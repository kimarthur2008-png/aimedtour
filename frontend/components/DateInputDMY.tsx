'use client';

import { useState, useRef } from 'react';

interface Props {
    value: string;
    onChange: (v: string) => void;
    icon?: string;
}

function validate(d: string, m: string, y: string): string {
    if (!d || !m || !y || y.length < 4) return '';
    const di = parseInt(d, 10), mi = parseInt(m, 10), yi = parseInt(y, 10);
    if (mi < 1 || mi > 12) return 'Неверный месяц (1–12)';
    if (di < 1 || di > 31) return 'Неверный день';
    const date = new Date(yi, mi - 1, di);
    if (date.getMonth() !== mi - 1 || date.getDate() !== di) return 'Такой даты не существует';
    if (yi < 1900) return 'Неверный год';
    if (date > new Date()) return 'Дата не может быть в будущем';
    return '';
}

export default function DateInputDMY({ value, onChange, icon = '/icons/dateauth.svg' }: Props) {
    const [day,   setDay]   = useState(value ? value.split('-')[2] : '');
    const [month, setMonth] = useState(value ? value.split('-')[1] : '');
    const [year,  setYear]  = useState(value ? value.split('-')[0] : '');
    const [err,   setErr]   = useState('');
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef  = useRef<HTMLInputElement>(null);

    function update(d: string, m: string, y: string) {
        const e = validate(d, m, y);
        setErr(e);
        if (d && m && y && y.length === 4 && !e) {
            onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        } else {
            onChange('');
        }
    }

    return (
        <>
            <div className="flex items-center gap-1 px-4 py-3.5 rounded-2xl" style={{ border: '1.5px solid #DAE3E8' }}>
                {icon && <img src={icon} className="w-5 h-5 shrink-0 pointer-events-none mr-2" alt="" />}
                <input
                    type="text" inputMode="numeric" placeholder="ДД" maxLength={2} value={day}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setDay(v); update(v, month, year); if (v.length === 2) monthRef.current?.focus(); }}
                    className="w-8 text-body outline-none bg-transparent text-center"
                    style={{ color: '#21393B' }}
                />
                <span className="text-body select-none" style={{ color: '#21393B', opacity: 0.4 }}>/</span>
                <input
                    ref={monthRef}
                    type="text" inputMode="numeric" placeholder="ММ" maxLength={2} value={month}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setMonth(v); update(day, v, year); if (v.length === 2) yearRef.current?.focus(); }}
                    className="w-8 text-body outline-none bg-transparent text-center"
                    style={{ color: '#21393B' }}
                />
                <span className="text-body select-none" style={{ color: '#21393B', opacity: 0.4 }}>/</span>
                <input
                    ref={yearRef}
                    type="text" inputMode="numeric" placeholder="ГГГГ" maxLength={4} value={year}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setYear(v); update(day, month, v); }}
                    className="w-14 text-body outline-none bg-transparent"
                    style={{ color: '#21393B' }}
                />
            </div>
            {err && <p className="text-caption mt-1" style={{ color: '#e53e3e' }}>{err}</p>}
        </>
    );
}
