'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COUNTRIES = ['Кыргызстан', 'Казахстан', 'Россия', 'Узбекистан', 'Таджикистан', 'Другое'];

export default function ConsultForm() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [country, setCountry] = useState('');
  const [disease, setDisease] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit() {
    if (!name || !email) { setStatus('error'); return; }
    setStatus('loading');
    try {
      await addDoc(collection(db, 'consultations'), {
        name, email, phone, country, disease, message,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setStatus('success');
      setName(''); setEmail(''); setPhone(''); setCountry(''); setDisease(''); setMessage('');
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-lg w-full mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Записаться на консультацию</h2>
      <p className="text-sm text-gray-400 mb-6">Менеджер свяжется с вами в течение 24 часов</p>

      <div className="flex flex-col gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Имя *" className={inputCls} />
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email *" type="email" className={inputCls} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон / WhatsApp" className={inputCls} />

        <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
          <option value="">Выберите страну</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <input value={disease} onChange={(e) => setDisease(e.target.value)}
          placeholder="Диагноз / направление лечения" className={inputCls} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Дополнительная информация" rows={4}
          className={`${inputCls} resize-none`} />

        {status === 'error' && (
          <p className="text-red-500 text-xs">Заполните обязательные поля (имя и email)</p>
        )}
        {status === 'success' && (
          <p className="text-teal-600 text-sm font-medium">
            ✅ Заявка отправлена! Менеджер свяжется с вами в течение 24 часов.
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="w-full py-3 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 mt-1"
        >
          {status === 'loading' ? 'Отправляем...' : 'Отправить заявку'}
        </button>
      </div>
    </div>
  );
}
