/**
 * functions/src/index.ts — BE-07
 * Email-уведомление менеджеру при новой заявке на консультацию
 *
 * Как задеплоить:
 *   cd functions
 *   npm install
 *   firebase functions:secrets:set SENDGRID_API_KEY   ← вставь ключ
 *   firebase deploy --only functions
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

admin.initializeApp();

// ── Email менеджера — замени на реальный ──
const MANAGER_EMAIL = "менеджер@smart-k-medi.com";
const FROM_EMAIL    = "noreply@smart-k-medi.com";

// ════════════════════════════════════════════════════════
//  BE-07 — Срабатывает при создании нового документа
//  в коллекции /consultations
// ════════════════════════════════════════════════════════
export const onNewConsultation = functions.firestore.onDocumentCreated(
  "consultations/{id}",
  async (event) => {
    // Инициализируем SendGrid ключом из Firebase Secrets
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const data = event.data?.data();
    if (!data) return;

    const docId    = event.params.id;
    const dateStr  = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Bishkek" });

    // ── HTML-версия письма ──
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">🏥 Smart K-Medi — Новая заявка</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:120px">Имя</td>      <td style="padding:8px 0;font-weight:600">${data.name    || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td>     <td style="padding:8px 0"><a href="mailto:${data.email}">${data.email || '—'}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Телефон</td>   <td style="padding:8px 0">${data.phone   || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Страна</td>    <td style="padding:8px 0">${data.country || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Болезнь</td>   <td style="padding:8px 0">${data.disease || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Сообщение</td> <td style="padding:8px 0">${data.message || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Дата</td>      <td style="padding:8px 0;color:#64748b;font-size:13px">${dateStr}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
          <p style="font-size:13px;color:#64748b">
            ID заявки: <code>${docId}</code><br>
            Статус: <strong>new</strong> — смени статус в <a href="https://abas-d36ca.web.app/admin.html">Админке</a>
          </p>
        </div>
      </div>
    `;

    // ── Текстовая версия (fallback) ──
    const textBody = [
      `Новая заявка на консультацию — Smart K-Medi`,
      ``,
      `Имя:      ${data.name    || '—'}`,
      `Email:    ${data.email   || '—'}`,
      `Телефон:  ${data.phone   || '—'}`,
      `Страна:   ${data.country || '—'}`,
      `Болезнь:  ${data.disease || '—'}`,
      `Сообщение: ${data.message || '—'}`,
      ``,
      `Дата: ${dateStr}`,
      `ID заявки: ${docId}`,
    ].join("\n");

    await sgMail.send({
      to:      MANAGER_EMAIL,
      from:    FROM_EMAIL,
      subject: `📋 Новая заявка от ${data.name || "пользователя"} — Smart K-Medi`,
      text:    textBody,
      html:    htmlBody,
    });

    console.log(`[BE-07] Email отправлен для заявки ${docId}`);
  }
);
