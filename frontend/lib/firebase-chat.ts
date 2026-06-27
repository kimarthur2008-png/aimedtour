import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  getDoc,
  collection,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface CoordMessage {
  id: string;
  sender: 'user' | 'coordinator';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface CoordinatorChat {
  id: string;
  userId: string;
  userName: string;
  coordinatorId: string | null;
  coordinatorName: string | null;
  coordinatorPhotoURL: string | null;
  messages: CoordMessage[];
  pinnedMessages?: string[];
  status?: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface ArchivedChat {
  id: string;
  userId: string;
  userName: string;
  coordinatorId: string | null;
  coordinatorName: string | null;
  messages: CoordMessage[];
  closedAt: string;
  createdAt: string;
}

export async function sendCoordinatorMessage(
  userId: string,
  userName: string,
  sender: 'user' | 'coordinator',
  senderName: string,
  text: string
): Promise<void> {
  const chatRef = doc(db, 'coordinatorChats', userId);
  const msg: CoordMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender,
    senderName,
    text,
    timestamp: new Date().toISOString(),
  };
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    await setDoc(chatRef, {
      userId,
      userName,
      coordinatorId: null,
      coordinatorName: null,
      coordinatorPhotoURL: null,
      messages: [msg],
      pinnedMessages: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } else {
    await updateDoc(chatRef, {
      messages: arrayUnion(msg),
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function closeCoordinatorChat(userId: string): Promise<void> {
  const chatRef = doc(db, 'coordinatorChats', userId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const data = snap.data();
  if ((data.messages ?? []).length > 0) {
    await addDoc(collection(db, 'coordinatorChatsArchived'), {
      userId,
      userName: data.userName,
      coordinatorId: data.coordinatorId ?? null,
      coordinatorName: data.coordinatorName ?? null,
      messages: data.messages ?? [],
      createdAt: data.createdAt,
      closedAt: new Date().toISOString(),
    });
  }
  await updateDoc(chatRef, {
    status: 'closed',
    updatedAt: new Date().toISOString(),
  });
}

export async function startNewCoordinatorChat(
  userId: string,
  userName: string
): Promise<void> {
  const chatRef = doc(db, 'coordinatorChats', userId);
  await setDoc(chatRef, {
    userId,
    userName,
    coordinatorId: null,
    coordinatorName: null,
    coordinatorPhotoURL: null,
    messages: [],
    pinnedMessages: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function onArchivedChatsUpdated(
  userId: string,
  callback: (chats: ArchivedChat[]) => void
) {
  const q = query(collection(db, 'coordinatorChatsArchived'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const chats = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as ArchivedChat))
      .sort((a, b) => (b.closedAt > a.closedAt ? 1 : -1));
    callback(chats);
  });
}

export function onCoordinatorChatUpdated(
  userId: string,
  callback: (chat: CoordinatorChat | null) => void
) {
  const chatRef = doc(db, 'coordinatorChats', userId);
  return onSnapshot(chatRef, (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as CoordinatorChat) : null);
  });
}

export function onMyCoordinatorChatsUpdated(
  coordinatorId: string,
  callback: (chats: CoordinatorChat[]) => void
) {
  const q = query(
    collection(db, 'coordinatorChats'),
    where('coordinatorId', '==', coordinatorId)
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as CoordinatorChat))
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    callback(chats);
  });
}

export function onUnassignedChatsUpdated(callback: (chats: CoordinatorChat[]) => void) {
  const q = query(collection(db, 'coordinatorChats'), where('coordinatorId', '==', null));
  return onSnapshot(q, (snap) => {
    const chats = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as CoordinatorChat))
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    callback(chats);
  });
}

export async function pinMessage(userId: string, messageId: string): Promise<void> {
  const chatRef = doc(db, 'coordinatorChats', userId);
  await updateDoc(chatRef, { pinnedMessages: arrayUnion(messageId) });
}

export async function unpinMessage(userId: string, messageId: string): Promise<void> {
  const chatRef = doc(db, 'coordinatorChats', userId);
  await updateDoc(chatRef, { pinnedMessages: arrayRemove(messageId) });
}

export async function assignCoordinatorToChat(
  userId: string,
  coordinatorId: string,
  coordinatorName: string
): Promise<void> {
  const chatRef = doc(db, 'coordinatorChats', userId);
  const snap = await getDoc(chatRef);
  if (snap.exists()) {
    await updateDoc(chatRef, { coordinatorId, coordinatorName, updatedAt: new Date().toISOString() });
  }
}
