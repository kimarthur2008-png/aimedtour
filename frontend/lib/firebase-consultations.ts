import { httpsCallable } from 'firebase/functions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { functions, auth, db } from '@/lib/firebase';

export type ConsultationStatus = 'new' | 'in-progress' | 'done';

/**
 * Меняет статус заявки — вызывает Cloud Function updateConsultationStatus.
 * Доступно только для admin / consultant / coordinator.
 */
export async function updateConsultationStatus(id: string, status: ConsultationStatus) {
  const fn = httpsCallable(functions, 'updateConsultationStatus');
  await fn({ id, status });
}

/**
 * Назначает роль пользователю — вызывает Cloud Function setUserRole.
 * Доступно только для admin.
 */
export async function setUserRole(uid: string, role: string) {
  const fn = httpsCallable(functions, 'setUserRole');
  await fn({ uid, role });
}

/**
 * Меняет этап лечения пациента — прямой Firestore update.
 * Доступно для координатора, назначенного на эту заявку.
 */
export async function updateConsultationStage(id: string, stage: number): Promise<void> {
  await updateDoc(doc(db, 'consultations', id), { stage });
}

export async function confirmTreatmentComplete(id: string): Promise<void> {
  await updateDoc(doc(db, 'consultations', id), {
    stage: 7,
    status: 'done',
    completedAt: new Date().toISOString(),
  });
}

/**
 * Возвращает заявку пациента по userId.
 * coordinatorId обязателен — без него правила Firestore отклонят запрос (list-правило требует coordinatorId == uid).
 */
export async function getPatientConsultation(
  userId: string,
  coordinatorId: string
): Promise<{ id: string; stage?: number; status: ConsultationStatus; clinicName?: string } | null> {
  const q = query(
    collection(db, 'consultations'),
    where('userId', '==', userId),
    where('coordinatorId', '==', coordinatorId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as { id: string; stage?: number; status: ConsultationStatus; clinicName?: string };
}

/**
 * Отправляет инвайт консультанту на email.
 * Доступно только для admin.
 */
export async function createConsultantInvite(email: string): Promise<string> {
  const fn = httpsCallable<{ email: string }, { success: boolean; inviteUrl: string }>(functions, 'createConsultantInvite');
  const result = await fn({ email });
  return result.data.inviteUrl;
}

/**
 * Принимает инвайт: создаёт аккаунт, получает роль consultant, авто-логин.
 * Вызывается без авторизации (по одноразовому токену из ссылки).
 */
export async function acceptConsultantInvite(
  token: string,
  password: string,
  fullName: string
): Promise<void> {
  const fn = httpsCallable<unknown, { email: string }>(functions, 'acceptConsultantInvite');
  const result = await fn({ token, password, fullName });
  await signInWithEmailAndPassword(auth, result.data.email, password);
}
