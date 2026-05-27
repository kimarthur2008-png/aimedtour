"use strict";
/**
 * functions/src/storage.ts — BE-08
 * Загрузка фото в Firebase Storage.
 * Используется в админке для фото больниц и кейсов пациентов.
 *
 * Правила Storage (добавить в Firebase Console → Storage → Rules):
 *
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /images/{allPaths=**} {
 *       allow read: if true;                      // публичное чтение
 *       allow write: if request.auth != null;     // загружать только авторизованным
 *     }
 *   }
 * }
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
exports.uploadPhoto = uploadPhoto;
exports.uploadPhotoAndSave = uploadPhotoAndSave;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const storage = admin.storage();
// ── BE-08: Загрузить файл в Storage и получить публичный URL ────────────────
// path — папка в Storage, например 'hospitals' или 'cases/before'
// Возвращает публичный URL загруженного файла
async function uploadPhoto(fileBuffer, fileName, path, mimeType = 'image/jpeg') {
    const bucket = storage.bucket();
    const filePath = `images/${path}/${Date.now()}_${fileName}`;
    const fileRef = bucket.file(filePath);
    await fileRef.save(fileBuffer, {
        metadata: { contentType: mimeType },
    });
    // Делаем файл публично доступным
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
}
// ── Загрузить фото и сохранить URL в документ Firestore ─────────────────────
// collection_ — коллекция (например 'hospitals' или 'cases')
// docId       — ID документа
// field       — поле куда записать URL (например 'logoUrl' или 'beforeImg')
async function uploadPhotoAndSave(fileBuffer, fileName, storagePath, collection_, docId, field, mimeType) {
    const url = await uploadPhoto(fileBuffer, fileName, storagePath, mimeType);
    await db.collection(collection_).doc(docId).update({ [field]: url });
    console.log(`[BE-08] Фото загружено: ${url} → ${collection_}/${docId}.${field}`);
    return url;
}
//# sourceMappingURL=storage.js.map