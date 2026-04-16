'use client';

import { useHospitals } from '@/hooks/useHospitals';
import HospitalCard from '@/components/HospitalCard';

export default function HospitalsPage() {
  const { hospitals, loading, error } = useHospitals();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Клиники</h1>
        <p className="text-gray-500 mt-1">Все партнёрские медицинские центры Кореи</p>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((h) => <HospitalCard key={h.id} hospital={h} />)}
        </div>
      )}
    </div>
  );
}
