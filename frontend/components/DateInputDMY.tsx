'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
    value: string;
    onChange: (v: string) => void;
    icon?: string;
}

const MSGS = {
    RU: { badMonth: 'Неверный месяц (1–12)', badDay: 'Неверный день', noDate: 'Такой даты не существует', badYear: 'Неверный год', future: 'Дата не может быть в будущем' },
    EN: { badMonth: 'Invalid month (1–12)',   badDay: 'Invalid day',    noDate: 'This date does not exist',   badYear: 'Invalid year', future: 'Date cannot be in the future' },
    KO: { badMonth: '월이 올바르지 않습니다 (1–12)', badDay: '일이 올바르지 않습니다', noDate: '존재하지 않는 날짜입니다', badYear: '연도가 올바르지 않습니다', future: '미래 날짜는 입력할 수 없습니다' },
};

function validate(d: string, m: string, y: string, lang: 'RU' | 'EN' | 'KO'): string {
    const msg = MSGS[lang];
    if (!d || !m || !y || y.length < 4) return '';
    const di = parseInt(d, 10), mi = parseInt(m, 10), yi = parseInt(y, 10);
    if (mi < 1 || mi > 12) return msg.badMonth;
    if (di < 1 || di > 31) return msg.badDay;
    const date = new Date(yi, mi - 1, di);
    if (date.getMonth() !== mi - 1 || date.getDate() !== di) return msg.noDate;
    if (yi < 1900) return msg.badYear;
    if (date > new Date()) return msg.future;
    return '';
}

export default function DateInputDMY({ value, onChange, icon = '/icons/dateauth.svg' }: Props) {
    const { lang } = useLanguage();

    const [day,   setDay]   = useState(value ? value.split('-')[2] : '');
    const [month, setMonth] = useState(value ? value.split('-')[1] : '');
    const [year,  setYear]  = useState(value ? value.split('-')[0] : '');
    const [err,   setErr]   = useState('');

    const ref1 = useRef<HTMLInputElement>(null);
    const ref2 = useRef<HTMLInputElement>(null);
    const ref3 = useRef<HTMLInputElement>(null);

    function commit(d: string, m: string, y: string) {
        const e = validate(d, m, y, lang);
        setErr(e);
        if (d && m && y && y.length === 4 && !e) {
            onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        } else {
            onChange('');
        }
    }

    const inputCls = 'text-body outline-none bg-transparent text-center';
    const sep = <span className="text-body select-none" style={{ color: '#21393B', opacity: 0.4 }}>/</span>;

    // Korean format: YYYY / MM / DD
    if (lang === 'KO') {
        return (
            <>
                <div className="flex items-center gap-1 px-4 py-3.5 rounded-2xl" style={{ border: '1.5px solid #DAE3E8' }}>
                    {icon && <img src={icon} className="w-5 h-5 shrink-0 pointer-events-none mr-2" alt="" />}
                    <input
                        ref={ref1}
                        type="text" inputMode="numeric" placeholder="YYYY" maxLength={4} value={year}
                        onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setYear(v); commit(day, month, v); if (v.length === 4) ref2.current?.focus(); }}
                        className={`w-14 ${inputCls}`}
                        style={{ color: '#21393B' }}
                    />
                    {sep}
                    <input
                        ref={ref2}
                        type="text" inputMode="numeric" placeholder="MM" maxLength={2} value={month}
                        onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setMonth(v); commit(day, v, year); if (v.length === 2) ref3.current?.focus(); }}
                        className={`w-8 ${inputCls}`}
                        style={{ color: '#21393B' }}
                    />
                    {sep}
                    <input
                        ref={ref3}
                        type="text" inputMode="numeric" placeholder="DD" maxLength={2} value={day}
                        onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setDay(v); commit(v, month, year); }}
                        className={`w-8 ${inputCls}`}
                        style={{ color: '#21393B' }}
                    />
                </div>
                {err && <p className="text-caption mt-1" style={{ color: '#e53e3e' }}>{err}</p>}
            </>
        );
    }

    // RU / EN format: DD / MM / YYYY
    return (
        <>
            <div className="flex items-center gap-1 px-4 py-3.5 rounded-2xl" style={{ border: '1.5px solid #DAE3E8' }}>
                {icon && <img src={icon} className="w-5 h-5 shrink-0 pointer-events-none mr-2" alt="" />}
                <input
                    ref={ref1}
                    type="text" inputMode="numeric" placeholder="DD" maxLength={2} value={day}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setDay(v); commit(v, month, year); if (v.length === 2) ref2.current?.focus(); }}
                    className={`w-8 ${inputCls}`}
                    style={{ color: '#21393B' }}
                />
                {sep}
                <input
                    ref={ref2}
                    type="text" inputMode="numeric" placeholder="MM" maxLength={2} value={month}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setMonth(v); commit(day, v, year); if (v.length === 2) ref3.current?.focus(); }}
                    className={`w-8 ${inputCls}`}
                    style={{ color: '#21393B' }}
                />
                {sep}
                <input
                    ref={ref3}
                    type="text" inputMode="numeric" placeholder="YYYY" maxLength={4} value={year}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setYear(v); commit(day, month, v); }}
                    className={`w-14 ${inputCls}`}
                    style={{ color: '#21393B' }}
                />
            </div>
            {err && <p className="text-caption mt-1" style={{ color: '#e53e3e' }}>{err}</p>}
        </>
    );
}
