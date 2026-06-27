'use client';

import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useHospitals, type Hospital } from '@/hooks/useHospitals';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

import { SPEC_KEYS, SPEC_LABELS } from '@/lib/specs';

function SpecPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const selected = value.split(',').map((s) => s.trim()).filter(Boolean);
    function toggle(key: string) {
        const next = selected.includes(key)
            ? selected.filter((s) => s !== key)
            : [...selected, key];
        onChange(next.join(', '));
    }
    return (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl" style={{ border: '1.5px solid #DAE3E8', backgroundColor: 'white', minHeight: '48px' }}>
            {SPEC_KEYS.map((key) => {
                const active = selected.includes(key);
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => toggle(key)}
                        className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
                        style={active
                            ? { backgroundColor: '#21393B', color: '#F7FAE8' }
                            : { backgroundColor: '#F0F2EE', color: '#21393B' }}
                    >
                        {SPEC_LABELS[key].RU}
                    </button>
                );
            })}
        </div>
    );
}

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
    const { t } = useLanguage();
    const ah = t.admin.hospitals;
    const [saving,    setSaving]    = useState(false);
    const [confirm,   setConfirm]   = useState<string | null>(null);
    const [editId,    setEditId]    = useState<string | null>(null);
    const [form,      setForm]      = useState<FormState>(EMPTY_FORM);
    const [search,    setSearch]    = useState('');
    const [photos,    setPhotos]    = useState<string[]>([]);
    const [descLang,  setDescLang]  = useState<'RU' | 'EN' | 'KO'>('RU');
    const [descI18n,  setDescI18n]  = useState({ RU: '', EN: '', KO: '' });
    const [fullDescI18n, setFullDescI18n] = useState({ RU: '', EN: '', KO: '' });

    function set(field: keyof FormState, value: string) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    const EMPTY_I18N = { RU: '', EN: '', KO: '' };

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
        setDescI18n({
            RU: h.descriptionI18n?.RU ?? h.description ?? '',
            EN: h.descriptionI18n?.EN ?? '',
            KO: h.descriptionI18n?.KO ?? '',
        });
        setFullDescI18n({
            RU: h.fullDescriptionI18n?.RU ?? h.fullDescription ?? '',
            EN: h.fullDescriptionI18n?.EN ?? '',
            KO: h.fullDescriptionI18n?.KO ?? '',
        });
        setPhotos(h.photos ?? []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        setEditId(null);
        setForm(EMPTY_FORM);
        setDescI18n(EMPTY_I18N);
        setFullDescI18n(EMPTY_I18N);
        setPhotos([]);
    }

    function addPhoto() { setPhotos(p => [...p, '']); }
    function removePhoto(i: number) { setPhotos(p => p.filter((_, idx) => idx !== i)); }
    function updatePhoto(i: number, val: string) { setPhotos(p => p.map((u, idx) => idx === i ? val : u)); }

    function buildPayload() {
        return {
            name:                form.name.trim(),
            description:         descI18n.RU.trim() || form.description.trim(),
            descriptionI18n:     { RU: descI18n.RU.trim(), EN: descI18n.EN.trim(), KO: descI18n.KO.trim() },
            fullDescription:     fullDescI18n.RU.trim() || form.fullDescription.trim(),
            fullDescriptionI18n: { RU: fullDescI18n.RU.trim(), EN: fullDescI18n.EN.trim(), KO: fullDescI18n.KO.trim() },
            specializations: splitTags(form.specializations),
            certifications:  splitTags(form.certifications),
            logoUrl:         form.logoUrl.trim()  || null,
            photos:          photos.map(u => u.trim()).filter(Boolean),
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
        if (!form.name.trim() || !descI18n.RU.trim()) return;
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
            setDescI18n(EMPTY_I18N);
            setFullDescI18n(EMPTY_I18N);
            setPhotos([]);
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
                        ←
                    </Link>
                    <h1 className="text-h2" style={{ color: '#21393B' }}>{ah.title}</h1>
                </div>

                {/* ── Форма ───────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl p-6 mb-8" style={{ border: '1.5px solid #DAE3E8' }}>
                    <h2 className="text-h4 mb-6" style={{ color: '#21393B' }}>
                        {editId ? ah.save : ah.add}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <Field label={ah.name} hint={ah.nameHint}>
                            <input className={inputCls} style={inputStyle}
                                   placeholder="Asan Medical Center"
                                   value={form.name} onChange={(e) => set('name', e.target.value)} />
                        </Field>

                        <Field label={ah.founded}>
                            <input className={inputCls} style={inputStyle}
                                   placeholder="1989"
                                   value={form.founded} onChange={(e) => set('founded', e.target.value)} />
                        </Field>

                        {/* Язык описаний */}
                        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#DAE3E8' }}>
                            {(['RU', 'EN', 'KO'] as const).map(l => (
                                <button key={l} type="button" onClick={() => setDescLang(l)}
                                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                    style={descLang === l
                                        ? { backgroundColor: '#21393B', color: '#F7FAE8' }
                                        : { backgroundColor: 'transparent', color: '#21393B' }}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        <Field label={ah.shortDesc.replace('{lang}', descLang)} hint={ah.shortDescHint}>
                            <textarea className={inputCls + " resize-none"} style={inputStyle} rows={2}
                                      placeholder="Крупнейший медицинский центр Кореи..."
                                      value={descI18n[descLang]}
                                      onChange={(e) => setDescI18n(p => ({ ...p, [descLang]: e.target.value }))} />
                        </Field>

                        <Field label={ah.fullDesc.replace('{lang}', descLang)} hint={ah.fullDescHint}>
                            <textarea className={inputCls + " resize-none"} style={inputStyle} rows={4}
                                      placeholder="Подробное описание истории, специализации..."
                                      value={fullDescI18n[descLang]}
                                      onChange={(e) => setFullDescI18n(p => ({ ...p, [descLang]: e.target.value }))} />
                        </Field>

                        <Field label={ah.specs} hint={ah.specsHint}>
                            <SpecPicker value={form.specializations} onChange={(v) => set('specializations', v)} />
                        </Field>

                        <Field label={ah.certs} hint={ah.certsHint}>
                            <input className={inputCls} style={inputStyle}
                                   placeholder="JCI, KOIHA"
                                   value={form.certifications} onChange={(e) => set('certifications', e.target.value)} />
                        </Field>

                        <Field label={ah.beds}>
                            <input className={inputCls} style={inputStyle} type="number"
                                   placeholder="2700"
                                   value={form.beds} onChange={(e) => set('beds', e.target.value)} />
                        </Field>

                        <Field label={ah.doctors}>
                            <input className={inputCls} style={inputStyle} type="number"
                                   placeholder="9000"
                                   value={form.doctors} onChange={(e) => set('doctors', e.target.value)} />
                        </Field>

                        <Field label={ah.logoUrl} hint={ah.logoUrlHint}>
                            <input className={inputCls} style={inputStyle} type="url"
                                   placeholder="https://..."
                                   value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
                        </Field>

                        <Field label={ah.address}>
                            <input className={inputCls} style={inputStyle}
                                   placeholder="88 Olympic-ro, Seoul"
                                   value={form.address} onChange={(e) => set('address', e.target.value)} />
                        </Field>

                        <Field label={ah.phone}>
                            <input className={inputCls} style={inputStyle}
                                   placeholder="+82-2-3010-3114"
                                   value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                        </Field>

                        <Field label="Email">
                            <input className={inputCls} style={inputStyle} type="email"
                                   placeholder="international@hospital.kr"
                                   value={form.email} onChange={(e) => set('email', e.target.value)} />
                        </Field>

                        <Field label={ah.website} hint={ah.websiteHint}>
                            <input className={inputCls} style={inputStyle} type="url"
                                   placeholder="https://www.hospital.kr"
                                   value={form.website} onChange={(e) => set('website', e.target.value)} />
                        </Field>

                        {/* Превью главного фото */}
                        {form.logoUrl && (
                            <div className="md:col-span-2">
                                <p className="text-label mb-2" style={{ color: '#21393B' }}>{ah.photoPreview}</p>
                                <div className="h-[160px] w-full rounded-xl overflow-hidden">
                                    <img src={form.logoUrl} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}

                        {/* Фото галереи */}
                        <div className="md:col-span-2 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <p className="text-label" style={{ color: '#21393B' }}>{ah.galleryPhotos}</p>
                                <button type="button" onClick={addPhoto}
                                    className="text-sm px-3 py-1.5 rounded-xl transition-colors"
                                    style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>
                                    {ah.addPhoto}
                                </button>
                            </div>
                            {photos.length === 0 && (
                                <p className="text-caption" style={{ color: '#21393B', opacity: 0.4 }}>{ah.noGallery}</p>
                            )}
                            {photos.map((url, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        className={inputCls + ' flex-1'}
                                        style={inputStyle}
                                        type="url"
                                        placeholder={`https://... (фото ${i + 1})`}
                                        value={url}
                                        onChange={(e) => updatePhoto(i, e.target.value)}
                                    />
                                    {url && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <button type="button" onClick={() => removePhoto(i)}
                                        className="px-3 py-2 rounded-xl text-sm shrink-0 transition-colors"
                                        style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !form.name.trim() || !descI18n.RU.trim()}
                            className="px-6 py-2.5 rounded-xl text-btn text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#73907E' }}
                        >
                            {saving ? ah.saving : editId ? ah.save : ah.add}
                        </button>
                        {editId && (
                            <button onClick={cancelEdit}
                                    className="px-6 py-2.5 rounded-xl text-btn"
                                    style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                            >
                                {ah.cancel}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Список ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-h4" style={{ color: '#21393B' }}>
                            {ah.listTitle.replace('{count}', String(hospitals.length))}
                        </h2>
                        <input
                            className={inputCls}
                            style={{ ...inputStyle, maxWidth: 280 }}
                            placeholder={ah.search}
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
                            {search ? ah.noResults : ah.noClinics}
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
                                            href={`/hospital-page?id=${h.id}`}
                                            target="_blank"
                                            className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                            style={{ backgroundColor: '#F0F2EE', color: '#21393B' }}
                                        >
                                            ↗ {ah.view}
                                        </Link>
                                        <button
                                            onClick={() => startEdit(h)}
                                            className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                                        >
                                            {ah.edit}
                                        </button>
                                        <button
                                            onClick={() => setConfirm(h.id)}
                                            className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                            style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                                        >
                                            {ah.delete}
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
                        <h3 className="text-h4 mb-2" style={{ color: '#21393B' }}>{ah.deleteTitle}</h3>
                        <p className="text-caption mb-6" style={{ color: '#21393B', opacity: 0.7 }}>{ah.deleteDesc}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDelete(confirm)}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-btn text-white disabled:opacity-50"
                                style={{ backgroundColor: '#b91c1c' }}
                            >
                                {saving ? '...' : ah.delete}
                            </button>
                            <button
                                onClick={() => setConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl text-btn"
                                style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                            >
                                {ah.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
