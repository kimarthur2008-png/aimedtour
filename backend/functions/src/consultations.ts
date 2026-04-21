/**
 * functions/src/consultations.ts — BE-10
 * Логика работы с заявками на консультацию:
 * - смена статуса (new → in-progress → done)
 * - загрузка всех заявок для админки
 * - назначение координатора на заявку
 *
 * TODO для бэкендщика:
 * - реализовать автоназначение координатора (assignCoordinator)
 * - добавить фильтрацию по статусу и координатору
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

export type ConsultationStatus = 'new' | 'in-progress' | 'done';

export interface Consultation {
  id:            string;
  name:          string;
  email:         string;
  phone?:        string;
  country?:      string;
  disease?:      string;
  message?:      string;
  status:        ConsultationStatus;
  coordinatorId?: string; // TODO: заполняется при назначении координатора
  createdAt:     admin.firestore.Timestamp;
}

// ── BE-10: Сменить статус заявки ────────────────────────────────────────────
// Вызывается из админки когда координатор меняет статус
export async function changeConsultationStatus(id: string, newStatus: ConsultationStatus) {
  const allowed: ConsultationStatus[] = ['new', 'in-progress', 'done'];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Недопустимый статус: ${newStatus}. Допустимые: ${allowed.join(', ')}`);
  }
  await db.collection('consultations').doc(id).update({ status: newStatus });
  console.log(`[BE-10] Заявка ${id} → статус "${newStatus}"`);
}

// ── Загрузить все заявки (для админки) ──────────────────────────────────────
// Возвращает список заявок, отсортированных: new → in-progress → done
export async function loadConsultations(): Promise<Consultation[]> {
  const snap = await db.collection('consultations').get();
  const result: Consultation[] = [];
  snap.forEach(d => result.push({ id: d.id, ...d.data() } as Consultation));

  const order: Record<ConsultationStatus, number> = { 'new': 0, 'in-progress': 1, 'done': 2 };
  result.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  return result;
}

// ── TODO: Назначить координатора на заявку ──────────────────────────────────
// Бэкендщик должен реализовать логику автоназначения:
// - найти координатора с наименьшей нагрузкой (меньше всего активных заявок)
// - записать coordinatorId в документ заявки
// - обновить счётчик нагрузки координатора
export async function assignCoordinator(consultationId: string): Promise<void> {
  // TODO: реализовать
  // 1. Получить список координаторов из /users где role == 'coordinator'
  // 2. Для каждого посчитать количество заявок со статусом 'in-progress'
  // 3. Выбрать того у кого меньше всего
  // 4. Записать его uid в consultation.coordinatorId
  throw new Error('assignCoordinator: ещё не реализовано');
}
