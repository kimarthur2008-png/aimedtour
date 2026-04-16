'use client';

import type { WizardStep, WizardAnswers } from '@/hooks/useWizard';

interface Props {
  step: number;
  totalSteps: number;
  currentStep: WizardStep;
  answers: WizardAnswers;
  isLastStep: boolean;
  onSelect: (stepId: string, label: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Wizard({
  step, totalSteps, currentStep, answers, isLastStep,
  onSelect, onNext, onBack,
}: Props) {
  const selected = answers[currentStep.id];

  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Прогресс-бар */}
      <div className="flex items-center justify-center mb-8 gap-0">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div className={`h-0.5 w-8 ${i <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
              ${i < step ? 'bg-teal-500 text-white' : i === step ? 'bg-teal-600 text-white ring-4 ring-teal-100' : 'bg-gray-200 text-gray-500'}`}
            >
              {i < step ? '✓' : i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Карточка шага */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{currentStep.q}</h2>
        <p className="text-sm text-gray-400 mb-6">{currentStep.sub}</p>

        <div className="grid grid-cols-2 gap-3">
          {currentStep.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onSelect(currentStep.id, opt.label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all text-center
                ${selected === opt.label
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 hover:border-teal-300 text-gray-700'}`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← Назад
            </button>
          ) : <span />}

          <span className="text-xs text-gray-400">Шаг {step + 1} из {totalSteps}</span>

          <button
            onClick={onNext}
            disabled={!selected}
            className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium
              hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Показать результат →' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  );
}
