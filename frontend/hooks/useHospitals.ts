import { useEffect, useState } from 'react';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Hospital {
  id: string;
  name: string;
  specializations: string[];
  certifications: string[];
  description: string;
  descriptionI18n?: { RU?: string; EN?: string; KO?: string };
  fullDescription?: string;
  fullDescriptionI18n?: { RU?: string; EN?: string; KO?: string };
  logoUrl?: string;
  // ценовой тир: 'economy' | 'mid' | 'premium' | 'luxury'
  priceRange?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  founded?: string;
  beds?: number;
  doctors?: number;
  photos?: string[];
  rating?: number;
  reviewCount?: number;
  priceFrom?: number;
  recoveryDays?: string;
  operationsCount?: string;
}

export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, 'hospitals'), limit(1000)))
        .then((snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hospital));
          setHospitals(data);
        })
        .catch(() => setError('Не удалось загрузить клиники'))
        .finally(() => setLoading(false));
  }, []);

  return { hospitals, loading, error };
}

export function useHospital(id: string) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'hospitals', id))
        .then((snap) => {
          if (snap.exists()) {
            setHospital({ id: snap.id, ...snap.data() } as Hospital);
          } else {
            setError('Клиника не найдена');
          }
        })
        .catch(() => setError('Не удалось загрузить данные клиники'))
        .finally(() => setLoading(false));
  }, [id]);

  return { hospital, loading, error };
}