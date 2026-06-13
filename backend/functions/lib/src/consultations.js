"use strict";
/**
 * functions/src/consultations.ts
 * Логика работы с заявками и авто-назначение консультантов.
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
exports.findLeastLoadedConsultant = findLeastLoadedConsultant;
const admin = __importStar(require("firebase-admin"));
function getDb() {
    return admin.firestore();
}
// ── Сменить статус заявки ────────────────────────────────────────────────────
async function changeConsultationStatus(id, newStatus) {
    const allowed = ['new', 'in-progress', 'done'];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Недопустимый статус: ${newStatus}`);
    }
    await getDb().collection('consultations').doc(id).update({ status: newStatus });
}
// ── Найти консультанта с минимальной нагрузкой ───────────────────────────────
// Ищет в коллекции /users где role == 'consultant'
// ticketsCollection — коллекция для подсчёта нагрузки
// assignedField     — поле с UID консультанта в тикете
async function findLeastLoadedConsultant(ticketsCollection, assignedField) {
    var _a;
    const usersSnap = await getDb().collection('users')
        .where('role', '==', 'consultant')
        .get();
    if (usersSnap.empty)
        return null;
    const consultantUids = usersSnap.docs.map((d) => d.id);
    // Считаем незакрытые тикеты каждого консультанта
    const openSnap = await getDb().collection(ticketsCollection)
        .where('status', 'in', ['new', 'in-progress', 'open'])
        .get();
    const load = {};
    consultantUids.forEach((uid) => { load[uid] = 0; });
    openSnap.docs.forEach((d) => {
        const cId = d.data()[assignedField];
        if (cId && load[cId] !== undefined)
            load[cId]++;
    });
    const minLoad = Math.min(...Object.values(load));
    const candidates = Object.keys(load).filter((uid) => load[uid] === minLoad);
    return (_a = candidates[Math.floor(Math.random() * candidates.length)]) !== null && _a !== void 0 ? _a : null;
}
//# sourceMappingURL=consultations.js.map