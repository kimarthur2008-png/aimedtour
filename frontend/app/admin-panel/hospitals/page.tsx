'use client';

import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useHospitals, type Hospital } from '@/hooks/useHospitals';
import Link from 'next/link';

const EMPTY_FORM = {
    name:            '',
    description:     '',
    fullDescription: '',
    specializations: '',   // вводим через запятую
    certifications:  '',   // вводим через запятую
    logoUrl:         '',
    address:         '',
    phone:           '',
    email:           '',
    website:         '',
    founded:         '',
    beds:            '',
    doctors:         '',
};

type FormState = typeof EMPTY_FORM;

function splitTags(value: string): string[] {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-label" style={{ color: '#21393B' }}>{label}</label>
            {children}
            {hint && <p className="text-caption" style={{ color: '#73907E', opacity: 0.8 }}>{hint}</p>}
        </div>
    );
}

const inputCls = "px-4 py-3 rounded-xl text-body outline-none";
const inputStyle = { border: '1.5px solid #DAE3E8', color: '#21393B', backgroundColor: 'white' };

export default function HospitalsAdminPage() {
    const { hospitals, loading } = useHospitals();
    const [saving,  setSaving]  = useState(false);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [editId,  setEditId]  = useState<string | null>(null);
    const [form,    setForm]    = useState<FormState>(EMPTY_FORM);
    const [search,  setSearch]  = useState('');

    function set(field: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    function startEdit(h: Hospital) {
        setEditId(h.id);
        setForm({
            name:            h.name,
            description:     h.description,
            fullDescription: h.fullDescription ?? '',
            specializations: (h.specializations ?? []).join(', '),
            certifications:  (h.certifications  ?? []).join(', '),
            logoUrl:         h.logoUrl   ?? '',
            address:         h.address   ?? '',
            phone:           h.phone     ?? '',
            email:           h.email     ?? '',
            website:         h.website   ?? '',
            founded:         h.founded   ?? '',
            beds:            h.beds      ? String(h.beds)    : '',
            doctors:         h.doctors   ? String(h.doctors) : '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        setEditId(null);
        setForm(EMPTY_FORM);
    }

    function buildPayload() {
        return {
            name:            form.name.trim(),
            description:     form.description.trim(),
            fullDescription: form.fullDescription.trim(),
            specializations: splitTags(form.specializations),
            certifications:  splitTags(form.certifications),
            logoUrl:         form.logoUrl.trim()  || null,
            address:         form.address.trim()  || null,
            phone:           form.phone.trim()    || null,
            email:           form.email.trim()    || null,
            website:         form.website.trim()  || null,
            founded:         form.founded.trim()  || null,
            beds:            form.beds    ? Number(form.beds)    : null,
            doctors:         form.doctors ? Number(form.doctors) : null,
        };
    }

    async function handleSubmit() {
        if (!form.name.trim() || !form.description.trim()) return;
        setSaving(true);
        try {
            if (editId) {
                await updateDoc(doc(db, 'hospitals', editId), buildPayload());
                setEditId(null);
            } else {
                await addDoc(collection(db, 'hospitals'), {
                    ...buildPayload(),
                    createdAt: serverTimestamp(),
                });
            }
            setForm(EMPTY_FORM);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        setSaving(true);
        try {
            await deleteDoc(doc(db, 'hospitals', id));
            setConfirm(null);
        } finally {
            setSaving(false);
        }
    }

    const filtered = hospitals.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }}>
            <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,60px)] py-10">

                {/* Шапка */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin-panel" className="text-caption hover:underline" style={{ color: '#4C6D7C' }}>
                        ← Назад
                    </Link>
                    <h1 className="text-h2" style={{ color: '#21393B' }}>Управление клиниками</h1>
                </div>

                {/* ── Форма ───────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-6 mb-8" style={{ border: '1.5px solid #DAE3E8' }}>
                    <h2 className="text-h4 mb-6" style={{ color: '#21393B' }}>
                        {editId ? 'Редактировать клинику' : 'Добавить клинику'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <Field label="Название *" hint="Официальное название клиники">
                            <input className={inputCls} style={inputStyle}
                                   placeholder="Asan Medical Center"
                                   value={form.name} onChange={(e) => set('name', e.target.value)} />
                        </Field>

                        <Field label="Год основания">
                            <input className={inputCls} style={inputStyle}
                                   placeholder="1989"
                                   value={form.founded} onChange={(e) => set('founded', e.target.value)} />
                        </Field>

                        <Field label="Краткое описание *" hint="Показывается в карточке каталога">
                            <textarea className={inputCls + " resize-none"} style={inputStyle} rows={2}
                                      placeholder="Крупнейший медицинский центр Кореи..."
                                      value={form.description} onChange={(e) => set('description', e.target.value)} />
                        </Field>

                        <Field label="Детальное описание" hint="Показывается на странице клиники">
                            <textarea className={inputCls + " resize-none"} style={inputStyle} rows={2}
                                      placeholder="Подробное описание истории, специализации..."
                                      value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} />
                        </Field>

                        <Field label="Специализации" hint="Через запятую: Онкология, Кардиология">
                            <input className={inputCls} style={inputStyle}
                                   placeholder="Онкология, Кардиология, Нейрохирургия"
                                   value={form.specializations} onChange={(e) => set('specializations', e.target.value)} />
                        </Field>

                        <Field label="Сертификаты" hint="Через запятую: JCI, KOIHA">
                            <input className={inputCls} style={inputStyle}
                                   placeholder="JCI, KOIHA"
                                   value={form.certifications} onChange={(e) => set('certifications', e.target.value)} />
                        </Field>

                        <Field label="Коек">
                            <input className={inputCls} style={inputStyle} type="number"
                                   placeholder="2700"
                                   value={form.beds} onChange={(e) => set('beds', e.target.value)} />
                        </Field>

                        <Field label="Врачей">
                            <input className={inputCls} style={inputStyle} type="number"
                                   placeholder="9000"
                                   value={form.doctors} onChange={(e) => set('doctors', e.target.value)} />
                        </Field>

                        <Field label="Фото (URL)" hint="Главное фото клиники">
                            <input className={inputCls} style={inputStyle} type="url"
                                   placeholder="https://..."
                                   value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
                        </Field>

                        <Field label="Адрес">
                            <input className={inputCls} style={inputStyle}
                                   placeholder="88 Olympic-ro, Seoul"
                                   value={form.address} onChange={(e) => set('address', e.target.value)} />
                        </Field>

                        <Field label="Телефон">
                            <input className={inputCls} style={inputStyle}
                                   placeholder="+82-2-3010-3114"
                                   value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                        </Field>

                        <Field label="Email">
                            <input className={inputCls} style={inputStyle} type="email"
                                   placeholder="international@hospital.kr"
                                   value={form.email} onChange={(e) => set('email', e.target.value)} />
                        </Field>

                        <Field label="Сайт" hint="С https://">
                            <input className={inputCls} style={inputStyle} type="url"
                                   placeholder="https://www.hospital.kr"
                                   value={form.website} onChange={(e) => set('website', e.target.value)} />
                        </Field>

                        {/* Превью фото */}
                        {form.logoUrl && (
                            <div className="md:col-span-2">
                                <p className="text-label mb-2" style={{ color: '#21393B' }}>Превью фото</p>
                                <div className="h-[160px] w-full rounded-xl overflow-hidden">
                                    <img src={form.logoUrl} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !form.name.trim() || !form.description.trim()}
                            className="px-6 py-2.5 rounded-xl text-btn text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#73907E' }}
                        >
                            {saving ? 'Сохранение...' : editId ? 'Сохранить изменения' : 'Добавить клинику'}
                        </button>
                        {editId && (
                            <button onClick={cancelEdit}
                                    className="px-6 py-2.5 rounded-xl text-btn"
                                    style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                            >
                                Отмена
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Список ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-h4" style={{ color: '#21393B' }}>
                            Клиники ({hospitals.length})
                        </h2>
                        <input
                            className={inputCls}
                            style={{ ...inputStyle, maxWidth: 280 }}
                            placeholder="Поиск по названию..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" style={{ border: '1.5px solid #DAE3E8' }} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-body" style={{ color: '#21393B', opacity: 0.5 }}>
                            {search ? 'Ничего не найдено' : 'Клиники ещё не добавлены'}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filtered.map((h) => (
                                <div
                                    key={h.id}
                                    className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
                                    style={{ border: '1.5px solid #DAE3E8' }}
                                >
                                    {/* Фото */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                        {h.logoUrl
                                            ? <img src={h.logoUrl} alt="" className="w-full h-full object-cover" />
                                            : <div className="w-full h-full" style={{ backgroundColor: '#DAE3E8' }} />
                                        }
                                    </div>

                                    {/* Инфо */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-h4 truncate" style={{ color: '#21393B' }}>{h.name}</p>
                                        <p className="text-caption truncate mt-0.5" style={{ color: '#21393B', opacity: 0.6 }}>
                                            {h.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {h.certifications?.map((c) => (
                                                <span key={c} className="text-caption px-2 py-0.5 rounded-full"
                                                      style={{ backgroundColor: 'rgba(61,97,109,0.12)', color: '#3D616D', fontWeight: 600 }}>
                                                    {c}
                                                </span>
                                            ))}
                                            {h.specializations?.slice(0, 3).map((s) => (
                                                <span key={s} className="text-caption px-2 py-0.5 rounded-full"
                                                      style={{ backgroundColor: 'rgba(76,109,124,0.1)', color: '#4C6D7C' }}>
                                                    {s}
                                                </span>
                                            ))}
                                            {(h.specializations?.length ?? 0) > 3 && (
                                                <span className="text-caption px-2 py-0.5 rounded-full"
                                                      style={{ backgroundColor: 'rgba(76,109,124,0.1)', color: '#4C6D7C' }}>
                                                    +{h.specializations.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Кнопки */}
                                    <div className="flex gap-2 shrink-0">
                                        <Link
                                            href={`/hospitals/${h.id}`}
                                            target="_blank"
                                            className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                            style={{ backgroundColor: '#F0F2EE', color: '#21393B' }}
                                        >
                                            ↗ Просмотр
                                        </Link>
                                        <button
                                            onClick={() => startEdit(h)}
                                            className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            onClick={() => setConfirm(h.id)}
                                            className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                            style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Диалог подтверждения ─────────────────────────────────── */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-h4 mb-2" style={{ color: '#21393B' }}>Удалить клинику?</h3>
                        <p className="text-caption mb-6" style={{ color: '#21393B', opacity: 0.7 }}>
                            Это действие нельзя отменить. Страница клиники также перестанет работать.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDelete(confirm)}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-btn text-white disabled:opacity-50"
                                style={{ backgroundColor: '#b91c1c' }}
                            >
                                {saving ? '...' : 'Удалить'}
                            </button>
                            <button
                                onClick={() => setConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl text-btn"
                                style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
