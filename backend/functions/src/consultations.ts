/**
 * functions/src/consultations.ts — BE-10 + BE-ASSIGN
 * Логика работы с заявками:
 *   - смена статуса (new → in-progress → done)
 *   - загрузка заявок (с фильтром по координатору)
 *   - автоназначение координатора с наименьшей нагрузкой
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

export type ConsultationStatus = 'new' | 'in-progress' | 'done';

export interface Consultation {
  id:             string;
  name:           string;
  email:          string;
  phone?:         string;
  country?:       string;
  disease?:       string;
  message?:       string;
  status:         ConsultationStatus;
  coordinatorId?: string;
  createdAt:      admin.firestore.Timestamp;
}


// ════════════════════════════════════════════════════════════════════════════
//  BE-10 — Сменить статус заявки
//  Вызывается из админки когда координатор или admin меняет статус
// ════════════════════════════════════════════════════════════════════════════
export async function changeConsultationStatus(
  id:        string,
  newStatus: ConsultationStatus
): Promise<void> {
  const allowed: ConsultationStatus[] = ['new', 'in-progress', 'done'];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Недопустимый статус: ${newStatus}. Допустимые: ${allowed.join(', ')}`);
  }
  await db.collection('consultations').doc(id).update({ status: newStatus });
  console.log(`[BE-10] Заявка ${id} → статус "${newStatus}"`);
}


// ════════════════════════════════════════════════════════════════════════════
//  Загрузить заявки
//  coordinatorId — если передан, фильтрует только заявки этого координатора
//  (для роли coordinator; admin вызывает без аргумента)
// ════════════════════════════════════════════════════════════════════════════
export async function loadConsultations(
  coordinatorId?: string
): Promise<Consultation[]> {

  let query: admin.firestore.Query = db.collection('consultations');

  // Координатор видит только свои заявки
  if (coordinatorId) {
    query = query.where('coordinatorId', '==', coordinatorId);
  }

  const snap   = await query.get();
  const result: Consultation[] = [];
  snap.forEach(d => result.push({ id: d.id, ...d.data() } as Consultation));

  const order: Record<ConsultationStatus, number> = {
    'new': 0, 'in-progress': 1, 'done': 2,
  };
  result.sort((a, b) => {
    const sd = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (sd !== 0) return sd;
    return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
  });

  return result;
}


// ════════════════════════════════════════════════════════════════════════════
//  BE-ASSIGN — Автоназначение координатора
//
//  Логика "наименьшая нагрузка":
//  1. Получаем всех пользователей с role == 'coordinator' из /users
//  2. Для каждого считаем активные заявки (статус new или in-progress)
//  3. Выбираем того у кого меньше всего активных заявок
//  4. Записываем его uid в consultation.coordinatorId
//
//  Вызывается из index.ts → onNewConsultation автоматически.
//  Если координаторов нет — кидает ошибку (она обрабатывается мягко).
// ════════════════════════════════════════════════════════════════════════════
export async function assignCoordinator(consultationId: string): Promise<void> {

  // 1. Получаем всех координаторов из /users
  const coordinatorsSnap = await db
    .collection('users')
    .where('role', '==', 'coordinator')
    .get();

  if (coordinatorsSnap.empty) {
    throw new Error('Нет доступных координаторов в /users');
  }

  // 2. Для каждого координатора считаем активные заявки параллельно
  //    Активные = статус 'new' или 'in-progress'
  const loadCounts = await Promise.all(
    coordinatorsSnap.docs.map(async (coordDoc) => {
      const uid = coordDoc.id;

      const activeSnap = await db
        .collection('consultations')
        .where('coordinatorId', '==', uid)
        .where('status', 'in', ['new', 'in-progress'])
        .get();

      return { uid, activeCount: activeSnap.size };
    })
  );

  // 3. Выбираем координатора с наименьшей нагрузкой
  //    При равенстве — первый в списке (порядок из Firestore)
  loadCounts.sort((a, b) => a.activeCount - b.activeCount);
  const chosen = loadCounts[0];

  // 4. Записываем coordinatorId в заявку
  await db.collection('consultations').doc(consultationId).update({
    coordinatorId:  chosen.uid,
    assignedAt:     admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(
    `[BE-ASSIGN] Заявка ${consultationId} → координатор ${chosen.uid} ` +
    `(активных заявок: ${chosen.activeCount})`
  );
}
