import { useEffect, useState } from 'react';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, setDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type TourismType = 'sights' | 'food' | 'shopping';

export interface TourismItem {
    id: string;
    type: TourismType;
    name: string;
    description: string;
    imageUrl: string;
    order: number;
    visible: boolean;
}

export interface TourismHero {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
}

// ── Публичный хук (только чтение) ───────────────────────────────────────────
export function useTourism() {
    const [items,   setItems]   = useState<TourismItem[]>([]);
    const [hero,    setHero]    = useState<TourismHero | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            getDocs(query(collection(db, 'tourism'), orderBy('order', 'asc'))),
            getDocs(collection(db, 'settings')),
        ])
            .then(([tourSnap, settingsSnap]) => {
                const data = tourSnap.docs
                    .map((d) => ({ id: d.id, ...d.data() } as TourismItem))
                    .filter((i) => i.visible !== false);
                setItems(data);

                const settingsDoc = settingsSnap.docs.find((d) => d.id === 'tourism');
                if (settingsDoc) setHero(settingsDoc.data() as TourismHero);
            })
            .catch(() => setError('Не удалось загрузить данные'))
            .finally(() => setLoading(false));
    }, []);

    const sights   = items.filter((i) => i.type === 'sights');
    const food     = items.filter((i) => i.type === 'food');
    const shopping = items.filter((i) => i.type === 'shopping');

    return { items, sights, food, shopping, hero, loading, error };
}

// ── Хук для админки (чтение + запись) ───────────────────────────────────────
export function useTourismAdmin() {
    const [items,   setItems]   = useState<TourismItem[]>([]);
    const [hero,    setHero]    = useState<TourismHero>({
        heroTitle:    'Исцеление и открытие',
        heroSubtitle: 'Ваше медицинское путешествие в Корее — это также возможность познакомиться с яркой культурой, мирового уровня шопинга и незабываемой кухней.',
        heroImageUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);

    async function reload() {
        setLoading(true);
        const [tourSnap, settingsSnap] = await Promise.all([
            getDocs(query(collection(db, 'tourism'), orderBy('order', 'asc'))),
            getDocs(collection(db, 'settings')),
        ]);
        setItems(tourSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TourismItem)));
        const settingsDoc = settingsSnap.docs.find((d) => d.id === 'tourism');
        if (settingsDoc) setHero(settingsDoc.data() as TourismHero);
        setLoading(false);
    }

    useEffect(() => { reload(); }, []);

    async function addItem(item: Omit<TourismItem, 'id'>) {
        setSaving(true);
        await addDoc(collection(db, 'tourism'), { ...item, createdAt: serverTimestamp() });
        await reload();
        setSaving(false);
    }

    async function updateItem(id: string, data: Partial<TourismItem>) {
        setSaving(true);
        await updateDoc(doc(db, 'tourism', id), data);
        await reload();
        setSaving(false);
    }

    async function deleteItem(id: string) {
        setSaving(true);
        await deleteDoc(doc(db, 'tourism', id));
        await reload();
        setSaving(false);
    }

    async function saveHero(data: TourismHero) {
        setSaving(true);
        const ref = doc(db, 'settings', 'tourism');
        await setDoc(ref, data, { merge: true });
        setHero(data);
        setSaving(false);
    }

    return { items, hero, loading, saving, addItem, updateItem, deleteItem, saveHero, reload };
}