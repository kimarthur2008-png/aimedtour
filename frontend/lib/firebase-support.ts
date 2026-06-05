/**
 * Интеграция Support Ticket System с Firebase Firestore
 * 
 * Этот файл содержит функции для работы с Firebase Firestore
 * в контексте системы поддержки с тикетами и чатами
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { SupportTicket, ChatMessage, Clinic } from '@/data/users';

// ============================================
// Support Tickets - Тикеты поддержки
// ============================================

export const ticketsCollection = collection(db, 'supportTickets');

/**
 * Создать новый тикет поддержки
 */
export async function createSupportTicket(
  userId: string,
  userName: string,
  userEmail: string,
  topic: string,
  description: string
): Promise<string> {
  try {
    const docRef = await addDoc(ticketsCollection, {
      userId,
      userName,
      userEmail,
      consultantId: null,
      consultantName: null,
      topic,
      description,
      status: 'open',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text: description,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Ошибка при создании тикета:', error);
    throw error;
  }
}

/**
 * Получить все тикеты пользователя
 */
export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
  try {
    // ✅ Limit to 500 tickets per user to prevent memory issues
    const q = query(ticketsCollection, where('userId', '==', userId), limit(500));
    const querySnapshot = await getDocs(q);
    return (querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as SupportTicket[])
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  } catch (error) {
    console.error('Ошибка при получении тикетов:', error);
    throw error;
  }
}

/**
 * Получить все тикеты консультанта
 */
export async function getConsultantTickets(consultantId: string): Promise<SupportTicket[]> {
  try {
    // ✅ Limit to 500 tickets per consultant to prevent memory issues
    const q = query(ticketsCollection, where('consultantId', '==', consultantId), limit(500));
    const querySnapshot = await getDocs(q);
    return (querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as SupportTicket[])
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  } catch (error) {
    console.error('Ошибка при получении тикетов консультанта:', error);
    throw error;
  }
}

/**
 * Получить открытые (незакрытые) тикеты
 */
export async function getOpenTickets(): Promise<SupportTicket[]> {
  try {
    // ✅ Limit to 500 open tickets to prevent memory issues
    const q = query(ticketsCollection, where('status', '==', 'open'), limit(500));
    const querySnapshot = await getDocs(q);
    return (querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as SupportTicket[])
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  } catch (error) {
    console.error('Ошибка при получении открытых тикетов:', error);
    throw error;
  }
}

/**
 * Назначить консультанта на тикет
 */
export async function assignConsultantToTicket(
  ticketId: string,
  consultantId: string,
  consultantName: string
): Promise<void> {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, {
      consultantId,
      consultantName,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ошибка при назначении консультанта:', error);
    throw error;
  }
}

/**
 * Добавить сообщение в чат тикета
 */
export async function addMessageToTicket(
  ticketId: string,
  sender: 'user' | 'consultant',
  text: string
): Promise<void> {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
    };
    
    await updateDoc(ticketRef, {
      messages: arrayUnion(newMessage),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ошибка при добавлении сообщения:', error);
    throw error;
  }
}

/**
 * Закрыть тикет
 */
export async function closeTicket(ticketId: string): Promise<void> {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, {
      status: 'closed',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ошибка при закрытии тикета:', error);
    throw error;
  }
}

/**
 * Слушать изменения тикета в реальном времени
 */
export function onTicketUpdated(ticketId: string, callback: (ticket: SupportTicket | null) => void) {
  const docRef = doc(db, 'supportTickets', ticketId);
  const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() } as SupportTicket);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
}

/**
 * Слушать все тикеты пользователя в реальном времени
 */
export function onUserTicketsUpdated(userId: string, callback: (tickets: SupportTicket[]) => void) {
  const q = query(ticketsCollection, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket))
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    callback(tickets);
  });
}

/**
 * Слушать все тикеты консультанта в реальном времени
 */
export function onConsultantTicketsUpdated(consultantId: string, callback: (tickets: SupportTicket[]) => void) {
  const q = query(ticketsCollection, where('consultantId', '==', consultantId));
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket))
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    callback(tickets);
  });
}

// ============================================
// Clinics - Поликлиники
// ============================================

export const clinicsCollection = collection(db, 'clinics');

/**
 * Создать новую поликлинику
 */
export async function createClinic(clinic: Omit<Clinic, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(clinicsCollection, {
      ...clinic,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Ошибка при создании поликлиники:', error);
    throw error;
  }
}

/**
 * Получить все поликлиники
 */
export async function getAllClinics(): Promise<Clinic[]> {
  try {
    // ✅ Limit to 500 clinics to prevent memory exhaustion
    const querySnapshot = await getDocs(query(clinicsCollection, limit(500)));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Clinic[];
  } catch (error) {
    console.error('Ошибка при получении поликлиник:', error);
    throw error;
  }
}

/**
 * Получить поликлиники по стране
 */
export async function getClinicsByCountry(country: string): Promise<Clinic[]> {
  try {
    // ✅ Limit to 200 clinics per country to prevent memory issues
    const q = query(clinicsCollection, where('country', '==', country), limit(200));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Clinic[];
  } catch (error) {
    console.error('Ошибка при получении поликлиник по стране:', error);
    throw error;
  }
}

/**
 * Обновить поликлинику
 */
export async function updateClinic(clinicId: string, clinic: Partial<Clinic>): Promise<void> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    await updateDoc(clinicRef, clinic);
  } catch (error) {
    console.error('Ошибка при обновлении поликлиники:', error);
    throw error;
  }
}

/**
 * Удалить поликлинику
 */
export async function deleteClinic(clinicId: string): Promise<void> {
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    await deleteDoc(clinicRef);
  } catch (error) {
    console.error('Ошибка при удалении поликлиники:', error);
    throw error;
  }
}

// ============================================
// Consultant Users — пользователи с ролью consultant
// ============================================

export interface ConsultantUser {
  uid: string;
  nick: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt?: string;
}

export async function getConsultantUsers(): Promise<ConsultantUser[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'consultant'), limit(100))
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as ConsultantUser));
}

// ============================================
// Reviews — отзывы
// ============================================

export interface Review {
  id: string;
  userId: string;
  userName: string;
  procedure: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const reviewsCollection = collection(db, 'reviews');

export async function createReview(
  userId: string, userName: string, procedure: string, rating: number, comment: string
): Promise<string> {
  const docRef = await addDoc(reviewsCollection, {
    userId, userName, procedure, rating, comment,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export function onReviewsUpdated(callback: (reviews: Review[]) => void) {
  const q = query(reviewsCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
  });
}

// ============================================
// Storage — загрузка фото клиник
// ============================================

export async function uploadClinicPhoto(file: File): Promise<string> {
  const storageRef = ref(storage, `clinics/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

// ============================================
// Consultations — заявки на консультацию
// ============================================

export interface Consultation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  disease?: string;
  message?: string;
  status: 'new' | 'in-progress' | 'done';
  createdAt: string;
}

export async function getAllConsultations(): Promise<Consultation[]> {
  // ✅ Limit to 200 most recent consultations to prevent memory exhaustion
  const snap = await getDocs(
    query(
      collection(db, 'consultations'),
      orderBy('createdAt', 'desc'),
      limit(200)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Consultation));
}

export async function updateConsultationStatus(
  id: string,
  status: 'new' | 'in-progress' | 'done'
): Promise<void> {
  await updateDoc(doc(db, 'consultations', id), { status });
}

// ============================================
// AlgorithmResults — результаты подбора
// ============================================

export interface AlgorithmResult {
  id: string;
  userId: string;
  answers: Record<string, string>;
  topHospitals: string[];
  createdAt: string;
}

export async function getAlgorithmResults(): Promise<AlgorithmResult[]> {
  // ✅ Limit to 200 most recent algorithm results to prevent memory exhaustion
  const snap = await getDocs(
    query(
      collection(db, 'algorithmResults'),
      orderBy('createdAt', 'desc'),
      limit(200)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AlgorithmResult));
}

// ============================================
// Consultant Applications — Заявки на консультанта
// ============================================

export interface ConsultantApplication {
  id: string;
  userId: string;
  nick: string;
  email: string;
  fullName: string;
  currentPosition: string;
  yearsExperience: string;
  previousExperience: string;
  motivation: string;
  specialization: string;
  languages: string;
  certificates: string;
  status: 'new' | 'approved' | 'rejected';
  appliedAt: unknown;
}

export async function submitConsultantApplication(
  data: Omit<ConsultantApplication, 'id' | 'appliedAt' | 'status'>
): Promise<void> {
  await addDoc(collection(db, 'consultantApplications'), {
    ...data,
    status: 'new',
    appliedAt: serverTimestamp(),
  });
}

export async function getConsultantApplications(): Promise<ConsultantApplication[]> {
  const snap = await getDocs(
    query(collection(db, 'consultantApplications'), orderBy('appliedAt', 'desc'), limit(200))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConsultantApplication));
}

/** Принять заявку: обновить статус + записать уведомление пользователю */
export async function approveConsultantApplication(applicationId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'consultantApplications', applicationId), { status: 'approved' });
  await updateDoc(doc(db, 'users', userId), {
    pendingNotification: {
      type: 'consultant_approved',
      seenAt: null,
    },
  });
}

/** Отклонить заявку: обновить статус + записать уведомление пользователю */
export async function rejectConsultantApplication(applicationId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'consultantApplications', applicationId), { status: 'rejected' });
  await updateDoc(doc(db, 'users', userId), {
    pendingNotification: {
      type: 'consultant_rejected',
      seenAt: null,
    },
  });
}

/** Пользователь согласился с условиями → ставим роль consultant */
export async function confirmConsultantRole(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    role: 'consultant',
    pendingNotification: null,
  });
}

/** Пользователь увидел уведомление об отказе → очистить */
export async function clearPendingNotification(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    pendingNotification: null,
  });
}
