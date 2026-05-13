"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = exports.onNewConsultation = exports.setUserRole = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const sgMail = __importStar(require("@sendgrid/mail"));
const seed_1 = require("../../scripts/seed");
const consultations_1 = require("./consultations");
admin.initializeApp();
const MANAGER_EMAIL = 'manager@smart-k-medi.com'; // ← замени на реальный
const FROM_EMAIL = 'noreply@smart-k-medi.com';
// ════════════════════════════════════════════════════════════════════════════
//  УТИЛИТА: escapeHtml
//
//  БЫЛО: данные из Firestore вставлялись напрямую в HTML письма.
//  Если поле name содержит </td><script>... — HTML письма сломается.
//  СТАЛО: экранируем каждое поле перед вставкой.
// ════════════════════════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str)
        return '—';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    var _a;
    // 1. Проверяем что вызывающий — admin
    if (((_a = request.auth) === null || _a === void 0 ? void 0 : _a.token.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Только администратор может менять роли пользователей');
    }
    const { uid, role } = request.data;
    // 2. Валидируем входные данные — никогда не доверяем фронтенду
    if (!uid || typeof uid !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'uid обязателен и должен быть строкой');
    }
    const ALLOWED_ROLES = ['user', 'coordinator', 'admin'];
    if (!ALLOWED_ROLES.includes(role)) {
        throw new https_1.HttpsError('invalid-argument', `Недопустимая роль: "${role}". Допустимые: ${ALLOWED_ROLES.join(', ')}`);
    }
    // 3. Назначаем Custom Claim через Firebase Admin SDK
    await admin.auth().setCustomUserClaims(uid, { role });
    // 4. Дублируем роль в Firestore /users/{uid} для отображения в UI
    //    (Custom Claims видны только в токене — в Firestore их нет)
    await admin.firestore().doc(`users/${uid}`).set({
        role,
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true } // не перезаписываем остальные поля профиля
    );
    console.log(`[setUserRole] uid=${uid} → role=${role}`);
    return { success: true };
});
// ════════════════════════════════════════════════════════════════════════════
//  BE-07 — onNewConsultation
//  Email менеджеру при каждой новой заявке + автоназначение координатора
// ════════════════════════════════════════════════════════════════════════════
exports.onNewConsultation = functions.firestore.onDocumentCreated('consultations/{id}', async (event) => {
    var _a;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const docId = event.params.id;
    const dateStr = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bishkek' });
    // ── Шаг 1: автоназначение координатора ──────────────────────────────────
    // Запускаем параллельно с отправкой письма, не блокируем друг друга
    const assignPromise = (0, consultations_1.assignCoordinator)(docId).catch(err => {
        // Не падаем если нет координаторов — заявка всё равно создаётся
        console.warn(`[BE-ASSIGN] Не удалось назначить координатора: ${err.message}`);
    });
    // ── Шаг 2: отправляем email менеджеру ───────────────────────────────────
    // Экранируем все поля — защита от XSS в HTML письме
    const name = escapeHtml(data.name);
    const email = escapeHtml(data.email);
    const phone = escapeHtml(data.phone);
    const country = escapeHtml(data.country);
    const disease = escapeHtml(data.disease);
    const message = escapeHtml(data.message);
    const id = escapeHtml(docId);
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">🏥 Smart K-Medi — Новая заявка</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:120px">Имя</td>      <td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td>     <td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
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
        `Имя:       ${data.name || '—'}`,
        `Email:     ${data.email || '—'}`,
        `Телефон:   ${data.phone || '—'}`,
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
            to: MANAGER_EMAIL,
            from: FROM_EMAIL,
            subject: `📋 Новая заявка от ${data.name || 'пользователя'} — Smart K-Medi`,
            text: textBody,
            html: htmlBody,
        }),
        assignPromise,
    ]);
    console.log(`[BE-07] Email отправлен для заявки ${docId}`);
});
// ════════════════════════════════════════════════════════════════════════════
//  BE-SEED — заполнение тестовыми данными
//  Запускается вручную: firebase functions:call seedDatabase
// ════════════════════════════════════════════════════════════════════════════
exports.seedDatabase = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Необходима авторизация');
    }
    await (0, seed_1.seedIfEmpty)();
    return { success: true, message: 'Seed выполнен' };
});
//# sourceMappingURL=index.js.map