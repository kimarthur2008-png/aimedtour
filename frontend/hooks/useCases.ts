import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PatientCase {
  id: string;
  patientName: string;
  country: string;
  /** Специализация / направление (бейдж на десктопе) */
  category: string;
  /** Заголовок истории */
  result: string;
  testimonial: string;
  imageUrl?: string;
}

function mapDoc(id: string, data: Record<string, unknown>): PatientCase {
  const disease = (data.disease as string) || '';
  return {
    id,
    patientName: (data.patientName as string) || '',
    country: (data.country as string) || '',
    category: (data.category as string) || disease,
    result: (data.result as string) || '',
    testimonial: (data.testimonial as string) || '',
    imageUrl: data.imageUrl as string | undefined,
  };
}

export function useCases() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'cases'))
      .then((snap) => {
        const data = snap.docs.map((d) => mapDoc(d.id, d.data()));
        setCases(data);
      })
      .catch(() => setError('Не удалось загрузить отзывы'))
      .finally(() => setLoading(false));
  }, []);

  return { cases, loading, error };
}
