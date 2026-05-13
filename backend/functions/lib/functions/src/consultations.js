"use strict";
/**
 * functions/src/consultations.ts — BE-10 + BE-ASSIGN
 * Логика работы с заявками:
 *   - смена статуса (new → in-progress → done)
 *   - загрузка заявок (с фильтром по координатору)
 *   - автоназначение координатора с наименьшей нагрузкой
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
exports.changeConsultationStatus = changeConsultationStatus;
exports.loadConsultations = loadConsultations;
exports.assignCoordinator = assignCoordinator;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// ════════════════════════════════════════════════════════════════════════════
//  BE-10 — Сменить статус заявки
//  Вызывается из админки когда координатор или admin меняет статус
// ════════════════════════════════════════════════════════════════════════════
async function changeConsultationStatus(id, newStatus) {
    const allowed = ['new', 'in-progress', 'done'];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Недопустимый статус: ${newStatus}. Допустимые: ${allowed.join(', ')}`);
    }
    await db.collection('consultations').doc(id).update({ status: newStatus });
    console.log(`[BE-10] Заявка ${id} → статус "${newStatus}"`);
}
// ════════════════════════════════════════════════════════════════════════════
//  Загрузить заявки
//  coordinatorId — если передан, фильтрует только заявки этого координатора
//  (для роли coordinator; admin вызывает без аргумента)
// ════════════════════════════════════════════════════════════════════════════
async function loadConsultations(coordinatorId) {
    let query = db.collection('consultations');
    // Координатор видит только свои заявки
    if (coordinatorId) {
        query = query.where('coordinatorId', '==', coordinatorId);
    }
    const snap = await query.get();
    const result = [];
    snap.forEach(d => result.push(Object.assign({ id: d.id }, d.data())));
    const order = {
        'new': 0, 'in-progress': 1, 'done': 2,
    };
    result.sort((a, b) => {
        var _a, _b, _c, _d, _e, _f;
        const sd = ((_a = order[a.status]) !== null && _a !== void 0 ? _a : 9) - ((_b = order[b.status]) !== null && _b !== void 0 ? _b : 9);
        if (sd !== 0)
            return sd;
        return ((_d = (_c = b.createdAt) === null || _c === void 0 ? void 0 : _c.seconds) !== null && _d !== void 0 ? _d : 0) - ((_f = (_e = a.createdAt) === null || _e === void 0 ? void 0 : _e.seconds) !== null && _f !== void 0 ? _f : 0);
    });
    return result;
}
// ════════════════════════════════════════════════════════════════════════════
//  BE-ASSIGN — Автоназначение координатора
//
//  Логика "наименьшая нагрузка":
//  1. Получаем всех пользователей с role == 'coordinator' из /users
//  2. Для каждого считаем активные заявки (статус new или in-progress)
//  3. Выбираем того у кого меньше всего активных заявок
//  4. Записываем его uid в consultation.coordinatorId
//
//  Вызывается из index.ts → onNewConsultation автоматически.
//  Если координаторов нет — кидает ошибку (она обрабатывается мягко).
// ════════════════════════════════════════════════════════════════════════════
async function assignCoordinator(consultationId) {
    // 1. Получаем всех координаторов из /users
    const coordinatorsSnap = await db
        .collection('users')
        .where('role', '==', 'coordinator')
        .get();
    if (coordinatorsSnap.empty) {
        throw new Error('Нет доступных координаторов в /users');
    }
    // 2. Для каждого координатора считаем активные заявки параллельно
    //    Активные = статус 'new' или 'in-progress'
    const loadCounts = await Promise.all(coordinatorsSnap.docs.map(async (coordDoc) => {
        const uid = coordDoc.id;
        const activeSnap = await db
            .collection('consultations')
            .where('coordinatorId', '==', uid)
            .where('status', 'in', ['new', 'in-progress'])
            .get();
        return { uid, activeCount: activeSnap.size };
    }));
    // 3. Выбираем координатора с наименьшей нагрузкой
    //    При равенстве — первый в списке (порядок из Firestore)
    loadCounts.sort((a, b) => a.activeCount - b.activeCount);
    const chosen = loadCounts[0];
    // 4. Записываем coordinatorId в заявку
    await db.collection('consultations').doc(consultationId).update({
        coordinatorId: chosen.uid,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[BE-ASSIGN] Заявка ${consultationId} → координатор ${chosen.uid} ` +
        `(активных заявок: ${chosen.activeCount})`);
}
//# sourceMappingURL=consultations.js.map