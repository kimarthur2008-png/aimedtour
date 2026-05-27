interface Props {
  name: string;
  role: string;
  image?: string;
}

function initials(name: string) {
  return name
    .replace(/^Доктор\s+/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamMember({ name, role, image }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="relative w-[140px] h-[140px] md:w-[180px] md:h-[180px] rounded-full overflow-hidden shrink-0"
        style={{ border: '4px solid rgba(255,255,255,0.5)' }}
      >
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-h2 font-semibold"
            style={{ backgroundColor: '#DAE3E8', color: '#3D616D' }}
          >
            {initials(name)}
          </div>
        )}
      </div>
      <div>
        <p className="text-h3 font-semibold" style={{ color: '#21393B' }}>
          {name}
        </p>
        <p className="text-body mt-1" style={{ color: '#21393B', opacity: 0.75 }}>
          {role}
        </p>
      </div>
    </div>
  );
}
