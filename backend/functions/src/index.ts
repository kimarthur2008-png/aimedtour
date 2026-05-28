/**
 * functions/src/index.ts — точка входа всех Firebase Functions
 *
 * Как задеплоить:
 *   cd backend/functions
 *   npm install
 *   firebase functions:secrets:set SENDGRID_API_KEY
 *   firebase deploy --only functions
 *
 * Текущие функции:
 *   BE-07   onNewConsultation       — email менеджеру при новой заявке
 *   BE-ROLES setUserRole            — назначение роли (только admin)
 *   BE-ASSIGN onConsultationCreated — автоназначение координатора
 *   BE-SEED  seedDatabase           — заполнение тестовыми данными
 */

import * as functions from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin     from 'firebase-admin';
import * as sgMail    from '@sendgrid/mail';
import { seedIfEmpty } from './seed';
import { findLeastLoadedConsultant } from './consultations';

admin.initializeApp();

const MANAGER_EMAIL = 'tendai401@naver.com';
const FROM_EMAIL    = 'noreply@smart-k-medi.com';


// ════════════════════════════════════════════════════════════════════════════
//  УТИЛИТА: escapeHtml
//
//  БЫЛО: данные из Firestore вставлялись напрямую в HTML письма.
//  Если поле name содержит </td><script>... — HTML письма сломается.
//  СТАЛО: экранируем каждое поле перед вставкой.
// ════════════════════════════════════════════════════════════════════════════
function escapeHtml(str: string | undefined | null): string {
  if (!str) return '—';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}


// ════════════════════════════════════════════════════════════════════════════
//  Авто-назначение координатора на заявку по ID
// ════════════════════════════════════════════════════════════════════════════
async function assignCoordinator(consultationId: string) {
  const db = admin.firestore();

  const coordinatorId = await findLeastLoadedConsultant('consultations', 'coordinatorId');
  if (!coordinatorId) {
    console.warn(`[BE-ASSIGN] Нет координаторов — заявка ${consultationId} не назначена`);
    return;
  }

  const userDoc = await db.collection('users').doc(coordinatorId).get();
  const coordinatorData = userDoc.exists ? (userDoc.data() ?? {}) : {};

  await db.collection('consultations').doc(consultationId).update({
    coordinatorId,
    coordinatorName: coordinatorData['name'] ?? coordinatorData['fullName'] ?? '',
    updatedAt: new Date().toISOString(),
  });

  console.log(`[BE-ASSIGN] Заявка ${consultationId} → координатор ${coordinatorId}`);
}


// ════════════════════════════════════════════════════════════════════════════
//  BE-ROLES — setUserRole
//
//  Что делает:
//  Назначает Firebase Custom Claim { role } пользователю по uid.
//  Custom Claims живут внутри JWT-токена. Firestore Rules читает их
//  как request.auth.token.role — без дополнительных запросов к БД.
//
//  Кто может вызвать:
//  Только admin. Проверяем в самом начале — до любых других операций.
//
//  Допустимые роли:
//  - user        — обычный пользователь (по умолчанию при регистрации)
//  - coordinator — видит только назначенные ему заявки, меняет статус
//  - admin       — видит всё, назначает координаторов, меняет роли
//
//  Пример вызова с фронтенда (admin.html):
//    const setUserRole = httpsCallable(functions, 'setUserRole');
//    await setUserRole({ uid: 'abc123', role: 'coordinator' });
//
//  ВАЖНО: после смены роли пользователь должен перелогиниться
//  (или вызвать user.getIdToken(true)), чтобы новый токен применился.
// ════════════════════════════════════════════════════════════════════════════
export const setUserRole = onCall(async (request) => {

  // 1. Проверяем что вызывающий — admin
  if (request.auth?.token.role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Только администратор может менять роли пользователей'
    );
  }

  const { uid, role } = request.data as { uid: string; role: string };

  // 2. Валидируем входные данные — никогда не доверяем фронтенду
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'uid обязателен и должен быть строкой');
  }

  const ALLOWED_ROLES = ['user', 'coordinator', 'consultant', 'admin'];
  if (!ALLOWED_ROLES.includes(role)) {
    throw new HttpsError(
      'invalid-argument',
      `Недопустимая роль: "${role}". Допустимые: ${ALLOWED_ROLES.join(', ')}`
    );
  }

  // 3. Назначаем Custom Claim через Firebase Admin SDK
  await admin.auth().setCustomUserClaims(uid, { role });

  // 4. Дублируем роль в Firestore /users/{uid} для отображения в UI
  //    (Custom Claims видны только в токене — в Firestore их нет)
  await admin.firestore().doc(`users/${uid}`).set(
    {
      role,
      roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true } // не перезаписываем остальные поля профиля
  );

  console.log(`[setUserRole] uid=${uid} → role=${role}`);
  return { success: true };
});


// ════════════════════════════════════════════════════════════════════════════
//  BE-07 — onNewConsultation
//  Email менеджеру при каждой новой заявке + автоназначение координатора
// ════════════════════════════════════════════════════════════════════════════
export const onNewConsultation = functions.firestore.onDocumentCreated(
  'consultations/{id}',
  async (event) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const data = event.data?.data();
    if (!data) return;

    const docId   = event.params.id;
    const dateStr = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek' });

    // ── Шаг 1: автоназначение координатора ──────────────────────────────────
    // Запускаем параллельно с отправкой письма, не блокируем друг друга
    const assignPromise = assignCoordinator(docId).catch((err: unknown) => {
      // Не падаем если нет координаторов — заявка всё равно создаётся
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[BE-ASSIGN] Не удалось назначить координатора: ${message}`);
    });

    // ── Шаг 2: отправляем email менеджеру ───────────────────────────────────
    // Экранируем все поля — защита от XSS в HTML письме
    const name      = escapeHtml(data.name);
    const email     = escapeHtml(data.email);
    const rawEmail  = data.email || '';
    const phone     = escapeHtml(data.phone);
    const country   = escapeHtml(data.country);
    const disease   = escapeHtml(data.disease);
    const message   = escapeHtml(data.message);
    const id        = escapeHtml(docId);

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">🏥 Smart K-Medi — Новая заявка</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:120px">Имя</td>      <td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td>     <td style="padding:8px 0"><a href="mailto:${rawEmail}">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Телефон</td>   <td style="padding:8px 0">${phone}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Страна</td>    <td style="padding:8px 0">${country}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Болезнь</td>   <td style="padding:8px 0">${disease}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Сообщение</td> <td style="padding:8px 0">${message}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Дата</td>      <td style="padding:8px 0;color:#64748b;font-size:13px">${dateStr}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
          <p style="font-size:13px;color:#64748b">
            ID заявки: <code>${id}</code><br>
            Статус: <strong>new</strong> —
            <a href="https://abas-d36ca.web.app/admin.html">открыть в Админке</a>
          </p>
        </div>
      </div>
    `;

    const textBody = [
      'Новая заявка на консультацию — Smart K-Medi',
      '',
      `Имя:       ${data.name    || '—'}`,
      `Email:     ${data.email   || '—'}`,
      `Телефон:   ${data.phone   || '—'}`,
      `Страна:    ${data.country || '—'}`,
      `Болезнь:   ${data.disease || '—'}`,
      `Сообщение: ${data.message || '—'}`,
      '',
      `Дата: ${dateStr}`,
      `ID заявки: ${docId}`,
    ].join('\n');

    // Ждём оба промиса параллельно
    await Promise.all([
      sgMail.send({
        to:      MANAGER_EMAIL,
        from:    FROM_EMAIL,
        subject: `📋 Новая заявка от ${data.name || 'пользователя'} — Smart K-Medi`,
        text:    textBody,
        html:    htmlBody,
      }),
      assignPromise,
    ]);

    console.log(`[BE-07] Email отправлен для заявки ${docId}`);
  }
);


// ════════════════════════════════════════════════════════════════════════════
//  Авто-назначение консультанта при создании тикета поддержки
//  Срабатывает когда в /supportTickets появляется новый документ
// ════════════════════════════════════════════════════════════════════════════
export const onNewSupportTicket = functions.firestore.onDocumentCreated(
  'supportTickets/{id}',
  async (event) => {
    const ticketId = event.params.id;
    const data = event.data?.data();
    if (!data) return;

    // Если консультант уже назначен (например, клиентом) — ничего не делаем
    if (data.consultantId) {
      console.log(`[ASSIGN] Тикет ${ticketId} уже имеет консультанта — пропускаем`);
      return;
    }

    const db = admin.firestore();

    const topic     = escapeHtml(data['topic']);
    const userName  = escapeHtml(data['userName']);
    const userEmail = escapeHtml(data['userEmail']);
    const desc      = escapeHtml(data['description']);

    const consultantId = await findLeastLoadedConsultant('supportTickets', 'consultantId');
    if (!consultantId) {
      console.warn(`[ASSIGN] Нет консультантов в коллекции — тикет ${ticketId} не назначен`);
      return;
    }

    // consultantId = uid пользователя из /users с role='consultant'
    const userDoc = await db.collection('users').doc(consultantId).get();
    const consultantData = userDoc.exists ? (userDoc.data() ?? {}) : {};

    await db.collection('supportTickets').doc(ticketId).update({
      consultantId,
      consultantName: consultantData['name'] ?? '',
      updatedAt: new Date().toISOString(),
    });

    console.log(`[ASSIGN] Тикет ${ticketId} → консультант ${consultantId}`);

    // Email-уведомление консультанту
    const consultantEmail = consultantData['email'] as string | undefined;
    if (consultantEmail) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#7c3aed;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="color:#fff;margin:0">Smart K-Medi — Новый тикет</h2>
          </div>
          <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
            <p>Вам назначен новый тикет поддержки.</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748b;width:120px">Тема</td><td style="font-weight:600">${topic}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Пациент</td><td>${userName} (${userEmail})</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Описание</td><td>${desc}</td></tr>
            </table>
          </div>
        </div>`;
      await sgMail.send({
        to:      consultantEmail,
        from:    FROM_EMAIL,
        subject: `Новый тикет: ${data['topic'] ?? ticketId}`,
        text:    `Вам назначен тикет: ${data['topic'] ?? '—'}\nПациент: ${data['userName'] ?? '—'}\n${data['description'] ?? '—'}`,
        html,
      });
      console.log(`[ASSIGN] Email отправлен ${consultantEmail}`);
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  BE-STATUS — Смена статуса заявки + email пациенту
//  Вызывается из Admin Dashboard: updateConsultationStatus({ id, status })
// ════════════════════════════════════════════════════════════════════════════
export const updateConsultationStatus = onCall(async (request) => {
  const role = request.auth?.token.role;
  if (!role || !['admin', 'consultant', 'coordinator'].includes(role)) {
    throw new HttpsError('permission-denied', 'Недостаточно прав для смены статуса');
  }

  const { id, status } = request.data as { id: string; status: string };

  if (!id || typeof id !== 'string') {
    throw new HttpsError('invalid-argument', 'id заявки обязателен');
  }

  const ALLOWED_STATUSES = ['new', 'in-progress', 'done'];
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new HttpsError('invalid-argument', `Недопустимый статус: "${status}"`);
  }

  const db = admin.firestore();
  const docRef = db.collection('consultations').doc(id);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Заявка не найдена');
  }

  const prev = snap.data()!;
  await docRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth!.uid,
  });

  console.log(`[BE-STATUS] Заявка ${id}: ${prev.status} → ${status}`);

  // Email пациенту при смене на done
  if (status === 'done' && prev.email) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const patientName = escapeHtml(prev.name);
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#059669;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">Smart K-Medi — Ваша заявка обработана</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p>Здравствуйте, ${patientName}!</p>
          <p>Ваша заявка на консультацию была обработана. Наш координатор свяжется с вами
             в ближайшее время для уточнения деталей.</p>
          <p style="color:#64748b;font-size:13px">ID заявки: <code>${escapeHtml(id)}</code></p>
        </div>
      </div>`;

    await sgMail.send({
      to:      prev.email,
      from:    FROM_EMAIL,
      subject: `Smart K-Medi — Ваша заявка обработана`,
      text:    `Здравствуйте, ${prev.name || 'пациент'}! Ваша заявка на консультацию была обработана. Наш координатор свяжется с вами.`,
      html,
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[BE-STATUS] Не удалось отправить email пациенту: ${msg}`);
    });

    console.log(`[BE-STATUS] Email отправлен пациенту ${prev.email}`);
  }

  return { success: true };
});


// ════════════════════════════════════════════════════════════════════════════
//  BE-SEED — Заполнение Firestore тестовыми данными
//  Запускается вручную один раз: firebase functions:call seedDatabase
// ════════════════════════════════════════════════════════════════════════════
export const seedDatabase = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Необходима авторизация');
  }
  await seedIfEmpty();
  return { success: true, message: 'Seed выполнен' };
});

