/**
 * functions/src/consultations.ts
 * Логика работы с заявками и авто-назначение консультантов.
 */

import * as admin from 'firebase-admin';

function getDb() {
  return admin.firestore();
}

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
  coordinatorId?: string;
  createdAt:     admin.firestore.Timestamp;
}

// ── Сменить статус заявки ────────────────────────────────────────────────────
export async function changeConsultationStatus(id: string, newStatus: ConsultationStatus) {
  const allowed: ConsultationStatus[] = ['new', 'in-progress', 'done'];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Недопустимый статус: ${newStatus}`);
  }
  await getDb().collection('consultations').doc(id).update({ status: newStatus });
}

// ── Найти консультанта с минимальной нагрузкой ───────────────────────────────
// Ищет в коллекции /users где role == 'consultant'
// ticketsCollection — коллекция для подсчёта нагрузки
// assignedField     — поле с UID консультанта в тикете
export async function findLeastLoadedConsultant(
  ticketsCollection: string,
  assignedField: string
): Promise<string | null> {
  const usersSnap = await getDb().collection('users')
    .where('role', '==', 'consultant')
    .get();

  if (usersSnap.empty) return null;

  const consultantUids = usersSnap.docs.map((d) => d.id);

  // Считаем незакрытые тикеты каждого консультанта
  const openSnap = await getDb().collection(ticketsCollection)
    .where('status', 'in', ['new', 'in-progress', 'open'])
    .get();

  const load: Record<string, number> = {};
  consultantUids.forEach((uid) => { load[uid] = 0; });
  openSnap.docs.forEach((d) => {
    const cId = d.data()[assignedField] as string | undefined;
    if (cId && load[cId] !== undefined) load[cId]++;
  });

  const minLoad = Math.min(...Object.values(load));
  const candidates = Object.keys(load).filter((uid) => load[uid] === minLoad);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
