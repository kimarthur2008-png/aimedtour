import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

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
