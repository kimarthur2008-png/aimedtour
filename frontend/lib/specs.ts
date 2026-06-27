export const SPEC_KEYS = [
  'dentistry',
  'plastic_surgery',
  'diagnostics',
  'obstetrics',
  'gynecology',
  'ivf',
  'orthopedics',
  'cardiology',
  'neurology',
  'neurosurgery',
  'ophthalmology',
  'oncology',
  'rehabilitation',
  'transplantology',
] as const;

export type SpecKey = (typeof SPEC_KEYS)[number];

export const SPEC_LABELS: Record<SpecKey, { RU: string; EN: string; KO: string }> = {
  dentistry:        { RU: 'Стоматология',         EN: 'Dentistry',        KO: '치과' },
  plastic_surgery:  { RU: 'Пластическая хирургия', EN: 'Plastic Surgery',  KO: '성형외과' },
  diagnostics:      { RU: 'Диагностика',           EN: 'Diagnostics',      KO: '진단' },
  obstetrics:       { RU: 'Акушерство',            EN: 'Obstetrics',       KO: '산과학' },
  gynecology:       { RU: 'Гинекология',           EN: 'Gynecology',       KO: '부인과학' },
  ivf:              { RU: 'ЭКО',                   EN: 'IVF',              KO: '체외수정' },
  orthopedics:      { RU: 'Ортопедия',             EN: 'Orthopedics',      KO: '정형외과' },
  cardiology:       { RU: 'Кардиология',           EN: 'Cardiology',       KO: '심장학' },
  neurology:        { RU: 'Неврология',            EN: 'Neurology',        KO: '신경과학' },
  neurosurgery:     { RU: 'Нейрохирургия',         EN: 'Neurosurgery',     KO: '신경외과' },
  ophthalmology:    { RU: 'Офтальмология',         EN: 'Ophthalmology',    KO: '안과학' },
  oncology:         { RU: 'Онкология',             EN: 'Oncology',         KO: '종양학' },
  rehabilitation:   { RU: 'Реабилитация',          EN: 'Rehabilitation',   KO: '재활치료' },
  transplantology:  { RU: 'Трансплантология',      EN: 'Transplantology',  KO: '이식학' },
};

// Обратный маппинг: русская строка → ключ (для миграции старых данных)
const LEGACY_MAP: Record<string, SpecKey> = Object.fromEntries(
  Object.entries(SPEC_LABELS).map(([key, v]) => [v.RU, key as SpecKey])
);

export function translateSpec(value: string, lang: 'RU' | 'EN' | 'KO'): string {
  // Если это уже ключ
  if (value in SPEC_LABELS) return SPEC_LABELS[value as SpecKey][lang];
  // Если старая русская строка — конвертируем
  const key = LEGACY_MAP[value];
  if (key) return SPEC_LABELS[key][lang];
  // Неизвестное значение — отдаём как есть
  return value;
}
