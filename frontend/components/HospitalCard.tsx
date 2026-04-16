import type { Hospital } from '@/hooks/useHospitals';

interface Props {
  hospital: Hospital;
}

export default function HospitalCard({ hospital }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {hospital.logoUrl && (
        <img src={hospital.logoUrl} alt={hospital.name} className="h-10 object-contain self-start" />
      )}
      <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>

      <div className="flex flex-wrap gap-1">
        {hospital.certifications.map((c) => (
          <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium border border-teal-200">
            {c}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {hospital.specializations.map((s) => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {s}
          </span>
        ))}
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">{hospital.description}</p>
    </div>
  );
}
