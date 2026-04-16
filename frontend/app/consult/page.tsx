import ConsultForm from '@/components/ConsultForm';

export default function ConsultPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Консультация</h1>
        <p className="text-gray-500 mt-1">Оставьте заявку — координатор свяжется с вами в течение 24 часов</p>
      </div>
      <ConsultForm />
    </div>
  );
}
