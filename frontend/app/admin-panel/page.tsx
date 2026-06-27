'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTourismAdmin, TourismType, TourismItem, TourismHero } from '@/hooks/useTourism';
import { useLanguage } from '@/context/LanguageContext';

const EMPTY_FORM = {
    type:        'sights' as TourismType,
    name:        '',
    description: '',
    imageUrl:    '',
    order:       0,
    visible:     true,
};

function Badge({ type, labels }: { type: TourismType; labels: Record<TourismType, string> }) {
    const colors: Record<TourismType, string> = {
        sights:   'bg-blue-50 text-blue-700',
        food:     'bg-orange-50 text-orange-700',
        shopping: 'bg-purple-50 text-purple-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${colors[type]}`}>
      {labels[type]}
    </span>
    );
}

export default function TourismAdminPage() {
    const { items, hero, loading, saving, addItem, updateItem, deleteItem, saveHero } = useTourismAdmin();
    const { t } = useLanguage();
    const a = t.admin;
    const router = useRouter();

    async function handleLogout() {
        await signOut(auth);
        router.push('/');
    }

    const TYPE_LABELS: Record<TourismType, string> = {
        sights:   a.tourism.filters.sights,
        food:     a.tourism.filters.food,
        shopping: a.tourism.filters.shopping,
    };

    const [tab,        setTab]        = useState<'items' | 'hero'>('items');
    const [form,       setForm]       = useState(EMPTY_FORM);
    const [editId,     setEditId]     = useState<string | null>(null);
    const [heroForm,   setHeroForm]   = useState<TourismHero | null>(null);
    const [filterType, setFilterType] = useState<TourismType | 'all'>('all');
    const [confirm,    setConfirm]    = useState<string | null>(null);

    const currentHero = heroForm ?? hero;

    function startEdit(item: TourismItem) {
        setEditId(item.id);
        setForm({
            type:        item.type,
            name:        item.name,
            description: item.description,
            imageUrl:    item.imageUrl || '',
            order:       item.order,
            visible:     item.visible,
        });
    }

    function cancelEdit() {
        setEditId(null);
        setForm(EMPTY_FORM);
    }

    async function handleSubmit() {
        if (!form.name.trim()) return;
        if (editId) {
            await updateItem(editId, form);
            setEditId(null);
        } else {
            await addItem(form);
        }
        setForm(EMPTY_FORM);
    }

    async function handleDelete(id: string) {
        await deleteItem(id);
        setConfirm(null);
    }

    async function handleSaveHero() {
        if (!heroForm) return;
        await saveHero(heroForm);
    }

    const filtered = filterType === 'all' ? items : items.filter((i) => i.type === filterType);

    return (
        <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }}>
            <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,60px)] py-10">

                {/* Nav */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span
                        className="px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: '#21393B', color: '#F7FAE8' }}
                    >
                        {a.nav.tourism}
                    </span>
                    <Link
                        href="/admin-panel/hospitals"
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                    >
                        {a.nav.hospitals}
                    </Link>
                    <Link
                        href="/admin-panel/consultations"
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                    >
                        {a.nav.consultations}
                    </Link>
                    <Link
                        href="/admin-panel/users"
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                    >
                        {a.nav.users}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="ml-auto px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                    >
                        Выйти
                    </button>
                </div>

                <h1 className="text-h2 mb-8" style={{ color: '#21393B' }}>
                    {a.tourism.title}
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    {(['items', 'hero'] as const).map((tabKey) => (
                        <button
                            key={tabKey}
                            onClick={() => setTab(tabKey)}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                            style={tab === tabKey
                                ? { backgroundColor: '#21393B', color: '#F7FAE8' }
                                : { backgroundColor: '#DAE3E8', color: '#21393B' }}
                        >
                            {tabKey === 'items' ? a.tourism.tabs.cards : a.tourism.tabs.hero}
                        </button>
                    ))}
                </div>

                {/* ═══ TAB: CARDS ═══ */}
                {tab === 'items' && (
                    <div className="flex flex-col gap-8">

                        {/* Add / Edit form */}
                        <div className="bg-white rounded-2xl p-6 border border-[#DAE3E8]">
                            <h2 className="text-h4 mb-5" style={{ color: '#21393B' }}>
                                {editId ? a.tourism.editCard : a.tourism.addCard}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Type */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.type}</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value as TourismType })}
                                        className="px-4 py-3 rounded-xl border text-body outline-none"
                                        style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                    >
                                        {(Object.keys(TYPE_LABELS) as TourismType[]).map((typeKey) => (
                                            <option key={typeKey} value={typeKey}>{TYPE_LABELS[typeKey]}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Order */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.order}</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                                        className="px-4 py-3 rounded-xl text-body outline-none"
                                        style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                    />
                                </div>

                                {/* Name */}
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.name}</label>
                                    <input
                                        type="text"
                                        placeholder={a.tourism.namePh}
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="px-4 py-3 rounded-xl text-body outline-none"
                                        style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                    />
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.desc}</label>
                                    <textarea
                                        rows={3}
                                        placeholder={a.tourism.descPh}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="px-4 py-3 rounded-xl text-body outline-none resize-none"
                                        style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                    />
                                </div>

                                {/* Image URL */}
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.imageUrl}</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={form.imageUrl}
                                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                        className="px-4 py-3 rounded-xl text-body outline-none"
                                        style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                    />
                                </div>

                                {/* Visible */}
                                <div className="flex items-center gap-3">
                                    <input
                                        id="visible"
                                        type="checkbox"
                                        checked={form.visible}
                                        onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                                        className="w-4 h-4 accent-[#73907E]"
                                    />
                                    <label htmlFor="visible" className="text-label cursor-pointer" style={{ color: '#21393B' }}>
                                        {a.tourism.visible}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving || !form.name.trim()}
                                    className="px-6 py-2.5 rounded-xl text-btn text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: '#73907E' }}
                                >
                                    {saving ? a.tourism.saving : editId ? a.tourism.save : a.tourism.add}
                                </button>
                                {editId && (
                                    <button
                                        onClick={cancelEdit}
                                        className="px-6 py-2.5 rounded-xl text-btn transition-colors"
                                        style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                                    >
                                        {a.tourism.cancel}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'sights', 'food', 'shopping'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterType(f)}
                                    className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                    style={filterType === f
                                        ? { backgroundColor: '#21393B', color: '#F7FAE8' }
                                        : { backgroundColor: '#DAE3E8', color: '#21393B' }}
                                >
                                    {f === 'all' ? a.tourism.filters.all : TYPE_LABELS[f]}
                                </button>
                            ))}
                        </div>

                        {/* Cards list */}
                        {loading ? (
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-body" style={{ color: '#21393B', opacity: 0.5 }}>{a.tourism.noCards}</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filtered.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl px-5 py-4 border flex items-center gap-4"
                                        style={{ border: '1.5px solid #DAE3E8', opacity: item.visible ? 1 : 0.5 }}
                                    >
                                        {/* Preview */}
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                            {item.imageUrl
                                                ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full bg-gradient-to-br from-[#DAE3E8] to-[#C7D4D8]" />
                                            }
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-h4 truncate" style={{ color: '#21393B' }}>{item.name}</span>
                                                <Badge type={item.type} labels={TYPE_LABELS} />
                                                {!item.visible && (
                                                    <span className="px-2 py-0.5 rounded-lg text-xs bg-gray-100 text-gray-500">{a.tourism.hidden}</span>
                                                )}
                                            </div>
                                            <p className="text-caption truncate" style={{ color: '#21393B', opacity: 0.6 }}>
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Order */}
                                        <span className="text-caption shrink-0" style={{ color: '#73907E' }}>#{item.order}</span>

                                        {/* Actions */}
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                                style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                                            >
                                                {a.tourism.edit}
                                            </button>
                                            <button
                                                onClick={() => setConfirm(item.id)}
                                                className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                                                style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                                            >
                                                {a.tourism.delete}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB: HERO ═══ */}
                {tab === 'hero' && (
                    <div className="bg-white rounded-2xl p-6 border border-[#DAE3E8] max-w-[700px]">
                        <h2 className="text-h4 mb-5" style={{ color: '#21393B' }}>{a.tourism.hero}</h2>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.heroTitle}</label>
                                <input
                                    type="text"
                                    value={currentHero.heroTitle}
                                    onChange={(e) => setHeroForm({ ...currentHero, heroTitle: e.target.value })}
                                    className="px-4 py-3 rounded-xl text-body outline-none"
                                    style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                />
                                <p className="text-caption" style={{ color: '#73907E', opacity: 0.8 }}>
                                    {a.tourism.heroHint}
                                </p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.heroSub}</label>
                                <textarea
                                    rows={3}
                                    value={currentHero.heroSubtitle}
                                    onChange={(e) => setHeroForm({ ...currentHero, heroSubtitle: e.target.value })}
                                    className="px-4 py-3 rounded-xl text-body outline-none resize-none"
                                    style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-label" style={{ color: '#21393B' }}>{a.tourism.heroBg}</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={currentHero.heroImageUrl}
                                    onChange={(e) => setHeroForm({ ...currentHero, heroImageUrl: e.target.value })}
                                    className="px-4 py-3 rounded-xl text-body outline-none"
                                    style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                                />
                            </div>

                            {currentHero.heroImageUrl && (
                                <div className="h-[160px] rounded-xl overflow-hidden">
                                    <img src={currentHero.heroImageUrl} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <button
                                onClick={handleSaveHero}
                                disabled={saving || !heroForm}
                                className="mt-2 px-6 py-2.5 rounded-xl text-btn text-white disabled:opacity-50 transition-opacity hover:opacity-90 w-fit"
                                style={{ backgroundColor: '#73907E' }}
                            >
                                {saving ? a.tourism.saving : a.tourism.save}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-h4 mb-2" style={{ color: '#21393B' }}>{a.tourism.deleteTitle}</h3>
                        <p className="text-caption mb-6" style={{ color: '#21393B', opacity: 0.7 }}>
                            {a.tourism.deleteDesc}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDelete(confirm)}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-btn text-white disabled:opacity-50"
                                style={{ backgroundColor: '#b91c1c' }}
                            >
                                {saving ? '...' : a.tourism.delete}
                            </button>
                            <button
                                onClick={() => setConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl text-btn"
                                style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}
                            >
                                {a.tourism.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
