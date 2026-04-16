import type { MatchedHospital } from '@/hooks/useWizard';
import Link from 'next/link';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  results: MatchedHospital[];
  onReset: () => void;
}

export default function WizardResult({ results, onReset }: Props) {
  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900">Ваши топ-3 клиники</h2>
        <p className="text-gray-500 text-sm mt-1">На основе ваших ответов алгоритм подобрал лучшие варианты</p>
      </div>

      <div className="flex flex-col gap-4">
        {results.map((h, i) => (
          <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-gray-900">
                {MEDALS[i]} {h.name}
              </h3>
              <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {h.matchPercent}% совпадение
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {h.certifications.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{c}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {h.specializations.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{s}</span>
              ))}
            </div>

            <p className="text-sm text-gray-500">{h.description}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Link
          href="/consult"
          className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          💬 Записаться на консультацию
        </Link>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          🔄 Пройти заново
        </button>
      </div>
    </div>
  );
}
