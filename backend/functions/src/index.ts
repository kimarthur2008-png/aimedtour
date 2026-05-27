/**
 * functions/src/index.ts — точка входа всех Firebase Functions
 *
 * Как задеплоить:
 *   cd backend/functions
 *   npm install
 *   firebase functions:secrets:set SENDGRID_API_KEY   ← вставь ключ SendGrid
 *   firebase deploy --only functions
 *
 * Текущие функции:
 *   - onNewConsultation  (BE-07) — email менеджеру при новой заявке
 *   - onConsultationStatusChanged — TODO: уведомление пользователю при смене статуса
 *
 * TODO для бэкендщика:
 *   - реализовать автоназначение координатора (см. consultations.ts)
 *   - добавить роли пользователей через Firebase Custom Claims
 */

import * as functions from 'firebase-functions/v2';
import * as admin     from 'firebase-admin';
import * as sgMail    from '@sendgrid/mail';
import { seedIfEmpty } from '../../scripts/seed';
import { findLeastLoadedConsultant } from './consultations';

admin.initializeApp();

const MANAGER_EMAIL = 'менеджер@smart-k-medi.com';
const FROM_EMAIL    = 'noreply@smart-k-medi.com';

// ════════════════════════════════════════════════════════════════════════════
//  BE-07 — Email-уведомление при новой заявке
//  Срабатывает автоматически когда в /consultations появляется новый документ
// ════════════════════════════════════════════════════════════════════════════
export const onNewConsultation = functions.firestore.onDocumentCreated(
  'consultations/{id}',
  async (event) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const data = event.data?.data();
    if (!data) return;

    const docId   = event.params.id;
    const dateStr = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek' });

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">🏥 Smart K-Medi — Новая заявка</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:120px">Имя</td>       <td style="padding:8px 0;font-weight:600">${data.name    || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td>      <td style="padding:8px 0"><a href="mailto:${data.email}">${data.email || '—'}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Телефон</td>    <td style="padding:8px 0">${data.phone   || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Страна</td>     <td style="padding:8px 0">${data.country || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Болезнь</td>    <td style="padding:8px 0">${data.disease || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Сообщение</td>  <td style="padding:8px 0">${data.message || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Дата</td>       <td style="padding:8px 0;color:#64748b;font-size:13px">${dateStr}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
          <p style="font-size:13px;color:#64748b">
            ID заявки: <code>${docId}</code><br>
            Статус: <strong>new</strong> — смени статус в <a href="https://abas-d36ca.web.app/admin.html">Админке</a>
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

    await sgMail.send({
      to:      MANAGER_EMAIL,
      from:    FROM_EMAIL,
      subject: `📋 Новая заявка от ${data.name || 'пользователя'} — Smart K-Medi`,
      text:    textBody,
      html:    htmlBody,
    });

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

    // Находим наименее загруженного консультанта
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
              <tr><td style="padding:6px 0;color:#64748b;width:120px">Тема</td><td style="font-weight:600">${data['topic'] ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Пациент</td><td>${data['userName'] ?? '—'} (${data['userEmail'] ?? '—'})</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Описание</td><td>${data['description'] ?? '—'}</td></tr>
            </table>
          </div>
        </div>`;
      await sgMail.send({
        to:      consultantEmail,
        from:    FROM_EMAIL,
        subject: `Новый тикет: ${data['topic'] ?? ticketId}`,
        text:    `Вам назначен тикет: ${data['topic']}\nПациент: ${data['userName']}\n${data['description']}`,
        html,
      });
      console.log(`[ASSIGN] Email отправлен ${consultantEmail}`);
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  BE-SEED — Заполнение Firestore тестовыми данными
//  Запускается вручную один раз: firebase functions:call seedDatabase
// ════════════════════════════════════════════════════════════════════════════
export const seedDatabase = functions.https.onCall(async (request) => {
  // Только для авторизованных пользователей
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Необходима авторизация');
  }
  await seedIfEmpty();
  return { success: true, message: 'Seed выполнен' };
});

