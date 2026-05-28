/**
 * functions/src/seed.ts — BE-SEED
 * Заполняет Firestore тестовыми данными при первом запуске.
 * Запускается только если коллекции пустые — не перезаписывает существующие данные.
 */

import * as admin from 'firebase-admin';

function getDb() {
  return admin.firestore();
}

export async function seedIfEmpty() {

  const db = getDb();

  // ── Счётчики для главной страницы ──────────────────────────────────────────
  const settingsRef  = db.doc('settings/main');
  const settingsSnap = await settingsRef.get();
  if (!settingsSnap.exists) {
    await settingsRef.set({
      patients:  1240,
      countries: 28,
      years:     7,
      hospitals: 12,
    });
    console.log('[seed] settings/main создан');
  }

  // ── Больницы (фиксированные ID для связи с diseases) ────────────────────────
  const H = {
    asan:     'hospital-asan',
    snuh:     'hospital-snuh',
    severance:'hospital-severance',
    samsung:  'hospital-samsung',
    gangnam:  'hospital-gangnam',
  };
  const D = {
    gastric:  'disease-gastric-cancer',
    lung:     'disease-lung-cancer',
    heart:    'disease-myocardial-infarction',
    knee:     'disease-knee-osteoarthritis',
    stroke:   'disease-stroke',
    kidney:   'disease-kidney-transplant',
    rhino:    'disease-rhinoplasty',
    spine:    'disease-spine-treatment',
  };

  const hospitals = [
    {
      id:              H.asan,
      name:            'Asan Medical Center',
      specializations: ['Онкология', 'Кардиология', 'Нейрохирургия'],
      certifications:  ['JCI', 'KOIHA'],
      description:     'Крупнейший медицинский центр Кореи. 2700+ коек, 9000+ персонал.',
      diseaseIds:      [D.gastric, D.lung, D.heart],
    },
    {
      id:              H.snuh,
      name:            'Seoul National University Hospital',
      specializations: ['Онкология', 'Трансплантология', 'Ортопедия'],
      certifications:  ['JCI'],
      description:     'Ведущий университетский госпиталь с 130-летней историей.',
      diseaseIds:      [D.gastric, D.lung, D.kidney, D.knee],
    },
    {
      id:              H.severance,
      name:            'Severance Hospital (Yonsei)',
      specializations: ['Кардиология', 'Неврология', 'Ортопедия'],
      certifications:  ['JCI', 'KOIHA'],
      description:     'Первая западная больница Кореи. Более 100 специальностей.',
      diseaseIds:      [D.heart, D.stroke, D.knee, D.spine],
    },
    {
      id:              H.samsung,
      name:            'Samsung Medical Center',
      specializations: ['Онкология', 'Трансплантология'],
      certifications:  ['JCI'],
      description:     'Ведущий частный медицинский центр группы Samsung.',
      diseaseIds:      [D.gastric, D.lung, D.kidney],
    },
    {
      id:              H.gangnam,
      name:            'Gangnam Severance Hospital',
      specializations: ['Ортопедия', 'Пластическая хирургия', 'Реабилитация'],
      certifications:  ['KOIHA'],
      description:     'Специализация на ортопедии и восстановительной медицине.',
      diseaseIds:      [D.knee, D.rhino, D.spine],
    },
  ];
  for (const { id, ...data } of hospitals) {
    const ref = db.collection('hospitals').doc(id);
    if (!(await ref.get()).exists) {
      await ref.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
  console.log(`[seed] больницы проверены/добавлены`);

  // ── Болезни (с nameKo и hospitalIds) ───────────────────────────────────────
  const diseases = [
    { id: D.gastric, name: 'Рак желудка',             nameKo: '위암',           nameEn: 'Gastric Cancer',        category: 'Онкология',             keywords: ['рак', 'желудок', 'онкология', 'опухоль'],                  hospitalIds: [H.asan, H.snuh, H.samsung] },
    { id: D.lung,    name: 'Рак лёгких',              nameKo: '폐암',           nameEn: 'Lung Cancer',           category: 'Онкология',             keywords: ['рак', 'лёгкие', 'онкология'],                              hospitalIds: [H.asan, H.snuh, H.samsung] },
    { id: D.heart,   name: 'Инфаркт миокарда',        nameKo: '심근경색',       nameEn: 'Myocardial Infarction', category: 'Кардиология',           keywords: ['инфаркт', 'сердце', 'кардио'],                             hospitalIds: [H.asan, H.severance] },
    { id: D.knee,    name: 'Артроз коленного сустава', nameKo: '무릎 골관절염',  nameEn: 'Knee Osteoarthritis',   category: 'Ортопедия',             keywords: ['артроз', 'колено', 'сустав', 'ортопедия'],                  hospitalIds: [H.snuh, H.severance, H.gangnam] },
    { id: D.stroke,  name: 'Инсульт',                 nameKo: '뇌졸중',         nameEn: 'Stroke',                category: 'Неврология',            keywords: ['инсульт', 'мозг', 'неврология'],                           hospitalIds: [H.severance] },
    { id: D.kidney,  name: 'Трансплантация почки',     nameKo: '신장 이식',      nameEn: 'Kidney Transplant',     category: 'Трансплантология',      keywords: ['почка', 'трансплантация', 'пересадка'],                     hospitalIds: [H.snuh, H.samsung] },
    { id: D.rhino,   name: 'Пластика носа',           nameKo: '코성형',         nameEn: 'Rhinoplasty',           category: 'Пластическая хирургия', keywords: ['нос', 'пластика', 'ринопластика'],                          hospitalIds: [H.gangnam] },
    { id: D.spine,   name: 'Лечение позвоночника',    nameKo: '척추 치료',      nameEn: 'Spine Treatment',       category: 'Ортопедия',             keywords: ['позвоночник', 'спина', 'грыжа'],                            hospitalIds: [H.severance, H.gangnam] },
  ];
  for (const { id, ...data } of diseases) {
    const ref = db.collection('diseases').doc(id);
    if (!(await ref.get()).exists) {
      await ref.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
  console.log(`[seed] болезни проверены/добавлены`);

  // ── Кейсы пациентов (с beforeImg / afterImg) ───────────────────────────────
  const casesSnap = await db.collection('cases').get();
  if (casesSnap.empty) {
    const cases = [
      {
        patientName: 'Алия М.',
        country:     'Кыргызстан',
        disease:     'Рак желудка',
        hospitalId:  H.asan,
        result:      'Полная ремиссия после 6 месяцев терапии в Asan Medical Center',
        testimonial: 'Корейские врачи спасли мою жизнь. Сервис на высшем уровне, всё объяснили на русском языке.',
        beforeImg:   '',
        afterImg:    '',
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        patientName: 'Ержан С.',
        country:     'Казахстан',
        disease:     'Артроз колена',
        hospitalId:  H.severance,
        result:      'Эндопротезирование обоих колен. Через 3 месяца хожу без боли.',
        testimonial: 'Операция прошла идеально. Реабилитация была включена в программу.',
        beforeImg:   '',
        afterImg:    '',
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        patientName: 'Анна К.',
        country:     'Россия',
        disease:     'Инфаркт',
        hospitalId:  H.asan,
        result:      'Стентирование коронарных артерий. Выписан через 5 дней.',
        testimonial: 'Скорость реакции и качество оборудования — недостижимы у нас.',
        beforeImg:   '',
        afterImg:    '',
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      },
    ];
    for (const c of cases) await db.collection('cases').add(c);
    console.log(`[seed] добавлено ${cases.length} кейсов`);
  }

  // ── Туристические места ─────────────────────────────────────────────────────
  const tourSnap = await db.collection('tourism').get();
  if (tourSnap.empty) {
    const places = [
      { type: 'sights',   name: 'Дворец Кёнбоккун', description: 'Главный королевский дворец эпохи Чосон в центре Сеула.', location: 'Сеул, Чонно' },
      { type: 'shopping', name: 'Myeongdong',        description: 'Главный торговый район Сеула. Косметика, мода, уличная еда.', location: 'Сеул, Чун' },
      { type: 'food',     name: 'Gwangjang Market',  description: 'Старейший рынок Кореи. Биндэтток, юккедян, живые устрицы.', location: 'Сеул, Чонно' },
      { type: 'sights',   name: 'Namsan Tower',      description: 'Телебашня Н-Сеул на горе Намсан. Вид на весь Сеул.', location: 'Сеул, Ёнсан' },
    ];
    for (const p of places) {
      await db.collection('tourism').add({ ...p, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    console.log(`[seed] добавлено ${places.length} туристических мест`);
  }

  // ── Консультанты ────────────────────────────────────────────────────────────
  // Записываем в /users с role='consultant' — findLeastLoadedConsultant ищет именно там.
  // ВАЖНО: document ID должен совпадать с Firebase Auth UID консультанта.
  // Для тестовых данных используем placeholder-ID. После создания аккаунта
  // в Firebase Console замените на реальный UID.
  const consultants = [
    {
      id:    'consultant-placeholder-1',
      name:  'Анна Косметолога',
      email: 'anna@smart-k-medi.com',
      phone: '+996 312 234567',
      role:  'consultant',
    },
    {
      id:    'consultant-placeholder-2',
      name:  'Борис Кардиолог',
      email: 'boris@smart-k-medi.com',
      phone: '+996 312 234568',
      role:  'consultant',
    },
    {
      id:    'consultant-placeholder-3',
      name:  'Виктория Хирург',
      email: 'victoria@smart-k-medi.com',
      phone: '+996 312 234569',
      role:  'consultant',
    },
  ];
  for (const { id, ...data } of consultants) {
    const ref = db.collection('users').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
  console.log(`[seed] консультанты проверены/добавлены в /users`);

  console.log('[seed] готово');
}
