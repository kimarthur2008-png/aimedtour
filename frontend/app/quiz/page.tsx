'use client';

import { useHospitals } from '@/hooks/useHospitals';
import { useWizard } from '@/hooks/useWizard';
import Wizard from '@/components/Wizard';
import WizardResult from '@/components/WizardResult';

export default function QuizPage() {
  const { hospitals, loading } = useHospitals();
  const wizard = useWizard(hospitals);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Подбор клиники</h1>
        <p className="text-gray-500 mt-1">Алгоритм подберёт топ-3 клиники по вашим параметрам</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
        </div>
      ) : wizard.isDone ? (
        <WizardResult results={wizard.results!} onReset={wizard.reset} />
      ) : (
        <Wizard
          step={wizard.step}
          totalSteps={wizard.totalSteps}
          currentStep={wizard.currentStep}
          answers={wizard.answers}
          isLastStep={wizard.isLastStep}
          onSelect={wizard.selectOption}
          onNext={wizard.next}
          onBack={wizard.back}
        />
      )}
    </div>
  );
}
