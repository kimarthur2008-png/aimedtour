/**
 * scripts/seed.ts — BE-SEED
 * Заполняет Firestore тестовыми данными при первом запуске.
 * Запускается только если коллекции пустые — не перезаписывает существующие данные.
 *
 * Как запустить вручную:
 *   cd backend/functions
 *   npx ts-node ../scripts/seed.ts
 *
 * Или автоматически — вызывается из index.ts при первом деплое.
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

export async function seedIfEmpty() {

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

  // ── Больницы ────────────────────────────────────────────────────────────────
  const hospSnap = await db.collection('hospitals').get();
  if (hospSnap.empty) {
    const hospitals = [
      {
        name:            'Asan Medical Center',
        specializations: ['Онкология', 'Кардиология', 'Нейрохирургия'],
        certifications:  ['JCI', 'KOIHA'],
        description:     'Крупнейший медицинский центр Кореи. 2700+ коек, 9000+ персонал.',
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        name:            'Seoul National University Hospital',
        specializations: ['Онкология', 'Трансплантология', 'Ортопедия'],
        certifications:  ['JCI'],
        description:     'Ведущий университетский госпиталь с 130-летней историей.',
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        name:            'Severance Hospital (Yonsei)',
        specializations: ['Кардиология', 'Неврология', 'Ортопедия'],
        certifications:  ['JCI', 'KOIHA'],
        description:     'Первая западная больница Кореи. Более 100 специальностей.',
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        name:            'Samsung Medical Center',
        specializations: ['Онкология', 'Трансплантология'],
        certifications:  ['JCI'],
        description:     'Ведущий частный медицинский центр группы Samsung.',
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        name:            'Gangnam Severance Hospital',
        specializations: ['Ортопедия', 'Пластическая хирургия', 'Реабилитация'],
        certifications:  ['KOIHA'],
        description:     'Специализация на ортопедии и восстановительной медицине.',
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      },
    ];
    for (const h of hospitals) await db.collection('hospitals').add(h);
    console.log(`[seed] добавлено ${hospitals.length} больниц`);
  }

  // ── Болезни ─────────────────────────────────────────────────────────────────
  const disSnap = await db.collection('diseases').get();
  if (disSnap.empty) {
    const diseases = [
      { name: 'Рак желудка',             nameEn: 'Gastric Cancer',        category: 'Онкология',             keywords: ['рак', 'желудок', 'онкология', 'опухоль'] },
      { name: 'Рак лёгких',              nameEn: 'Lung Cancer',           category: 'Онкология',             keywords: ['рак', 'лёгкие', 'онкология'] },
      { name: 'Инфаркт миокарда',        nameEn: 'Myocardial Infarction', category: 'Кардиология',           keywords: ['инфаркт', 'сердце', 'кардио'] },
      { name: 'Артроз коленного сустава',nameEn: 'Knee Osteoarthritis',   category: 'Ортопедия',             keywords: ['артроз', 'колено', 'сустав', 'ортопедия'] },
      { name: 'Инсульт',                 nameEn: 'Stroke',                category: 'Неврология',            keywords: ['инсульт', 'мозг', 'неврология'] },
      { name: 'Трансплантация почки',    nameEn: 'Kidney Transplant',     category: 'Трансплантология',      keywords: ['почка', 'трансплантация', 'пересадка'] },
      { name: 'Пластика носа',           nameEn: 'Rhinoplasty',           category: 'Пластическая хирургия', keywords: ['нос', 'пластика', 'ринопластика'] },
      { name: 'Лечение позвоночника',    nameEn: 'Spine Treatment',       category: 'Ортопедия',             keywords: ['позвоночник', 'спина', 'грыжа'] },
    ];
    for (const d of diseases) {
      await db.collection('diseases').add({ ...d, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    console.log(`[seed] добавлено ${diseases.length} болезней`);
  }

  // ── Кейсы пациентов ─────────────────────────────────────────────────────────
  const casesSnap = await db.collection('cases').get();
  if (casesSnap.empty) {
    const cases = [
      {
        patientName: 'Алия М.',
        country:     '🇰🇬 Кыргызстан',
        disease:     'Рак желудка',
        result:      'Полная ремиссия после 6 месяцев терапии в Asan Medical Center',
        testimonial: 'Корейские врачи спасли мою жизнь. Сервис на высшем уровне, всё объяснили на русском языке.',
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        patientName: 'Ержан С.',
        country:     '🇰🇿 Казахстан',
        disease:     'Артроз колена',
        result:      'Эндопротезирование обоих колен. Через 3 месяца хожу без боли.',
        testimonial: 'Операция прошла идеально. Реабилитация была включена в программу.',
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        patientName: 'Анна К.',
        country:     '🇷🇺 Россия',
        disease:     'Инфаркт',
        result:      'Стентирование коронарных артерий. Выписан через 5 дней.',
        testimonial: 'Скорость реакции и качество оборудования — недостижимы у нас.',
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

  console.log('[seed] готово');
}
