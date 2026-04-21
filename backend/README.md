# backend/ — Smart K-Medi

Здесь живёт весь серверный код проекта.

## Структура

```
backend/
  functions/
    src/
      index.ts          ← точка входа, все Firebase Functions
      consultations.ts  ← логика заявок: смена статуса, загрузка, назначение координатора
      storage.ts        ← загрузка фото в Firebase Storage
  scripts/
    seed.ts             ← заполнение Firestore тестовыми данными
  admin.html            ← готовая админка (HTML)
  firestore.rules       ← правила безопасности Firestore
```

## Что уже готово

| Файл | Статус | Описание |
|------|--------|----------|
| `functions/src/index.ts` | ✅ готово | Email при новой заявке (нужен SendGrid ключ) |
| `functions/src/consultations.ts` | ✅ готово | Смена статуса, загрузка заявок |
| `functions/src/storage.ts` | ✅ готово | Загрузка фото |
| `scripts/seed.ts` | ✅ готово | Тестовые данные |
| `firestore.rules` | ✅ готово | Правила доступа |
| `admin.html` | ✅ готово | Интерфейс админки |

## Что нужно доделать (задачи бэкендщика)

### 1. Роли пользователей
Добавить через Firebase Custom Claims:
- `user` — обычный пользователь
- `coordinator` — координатор, видит назначенные ему заявки
- `admin` — видит всё, может назначать координаторов

Функция `setUserRole(uid, role)` — добавить в `index.ts`

### 2. Автоназначение координатора
Когда приходит новая заявка — автоматически назначить координатора с наименьшей нагрузкой.
Заготовка уже есть в `consultations.ts` → функция `assignCoordinator()`

### 3. Задеплоить функции
```bash
cd functions
npm install
firebase functions:secrets:set SENDGRID_API_KEY
firebase deploy --only functions
```

## Как запустить seed вручную
```bash
cd functions
npm install
npx ts-node ../scripts/seed.ts
```
