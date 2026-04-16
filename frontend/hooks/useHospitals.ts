import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Hospital {
  id: string;
  name: string;
  specializations: string[];
  certifications: string[];
  description: string;
  logoUrl?: string;
}

export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'hospitals'))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hospital));
        setHospitals(data);
      })
      .catch(() => setError('Не удалось загрузить клиники'))
      .finally(() => setLoading(false));
  }, []);

  return { hospitals, loading, error };
}
