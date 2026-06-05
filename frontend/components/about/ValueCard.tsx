type IconType = 'shield' | 'care' | 'transparency';

function ValueIcon({ type }: { type: IconType }) {
    if (type === 'shield') {
        return <img src="/icons/shield.svg" alt="" className="w-8 h-8" />;
    }
    if (type === 'care') {
        return <img src="/icons/handshake.svg" alt="" className="w-8 h-8" />;
    }
    return <img src="/icons/transparency.svg" alt="" className="w-8 h-8" />;
}

interface Props {
  title: string;
  description: string;
  icon: IconType;
}

export default function ValueCard({ title, description, icon }: Props) {
  return (
    <div
      className="animate-slide-up flex flex-col items-center text-center gap-4 rounded-2xl px-6 py-8 md:px-8 md:py-10 h-full bg-[#90AEBC]/80"
    >
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full"
        style={{ backgroundColor: '#46707E' }}
      >
        <ValueIcon type={icon} />
      </div>
      <h3 className="text-h3 text-primary-dark">{title}</h3>
      <p className="text-label text-primary-dark/85 leading-relaxed">{description}</p>
    </div>
  );
}
