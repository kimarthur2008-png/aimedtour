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

import * as admin from 'firebase-admin';

const db      = admin.firestore();
const storage = admin.storage();

// ── BE-08: Загрузить файл в Storage и получить публичный URL ────────────────
// path — папка в Storage, например 'hospitals' или 'cases/before'
// Возвращает публичный URL загруженного файла
export async function uploadPhoto(
  fileBuffer: Buffer,
  fileName:   string,
  path:       string,
  mimeType:   string = 'image/jpeg'
): Promise<string> {
  const bucket    = storage.bucket();
  const filePath  = `images/${path}/${Date.now()}_${fileName}`;
  const fileRef   = bucket.file(filePath);

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
export async function uploadPhotoAndSave(
  fileBuffer:  Buffer,
  fileName:    string,
  storagePath: string,
  collection_: string,
  docId:       string,
  field:       string,
  mimeType?:   string
): Promise<string> {
  const url = await uploadPhoto(fileBuffer, fileName, storagePath, mimeType);
  await db.collection(collection_).doc(docId).update({ [field]: url });
  console.log(`[BE-08] Фото загружено: ${url} → ${collection_}/${docId}.${field}`);
  return url;
}
