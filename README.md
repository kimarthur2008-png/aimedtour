# Smart K-Medi

Платформа медицинского туризма в Южную Корею.

**Стек:** Next.js (frontend) + Firebase Cloud Functions (backend) + Firestore + Firebase Auth + Firebase Storage

---

## Быстрый старт (для разработчика)

Если тебе передали этот проект и нужно просто запустить:

```bash
cd frontend
npm install
npm run dev
```

Открой http://localhost:3000 — всё работает. Данные берутся из облака Firebase (проект abas-d36ca), деплоить ничего не нужно.

**Почему не нужно деплоить?** Фронтенд подключается к Firebase через конфиг в `lib/firebase.ts`. Все данные (Firestore), авторизация (Auth), правила доступа — живут в облаке Google. Они общие для всех, кто запускает этот код. Деплой нужен только один раз владельцу проекта, чтобы загрузить Cloud Functions и правила на сервер.

---

## Полный деплой (только для владельца проекта)

Деплой нужен один раз, чтобы загрузить бекенд-функции и правила на сервер Firebase. После этого они работают для всех.

### Предварительные требования

1. **Firebase CLI** — установка:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Blaze план** — Firebase требует привязать карту для Cloud Functions и Storage.
   Перейди на https://console.firebase.google.com/project/abas-d36ca/usage/details и нажми "Upgrade".
   Это бесплатно при малом использовании:
   - Firestore: 50K чтений/день бесплатно
   - Functions: 2M вызовов/месяц бесплатно
   - Storage: 5GB бесплатно
   - Деньги списываются только при превышении лимитов (для учебного проекта — никогда)

3. **Firebase Storage** — активировать:
   Перейди на https://console.firebase.google.com/project/abas-d36ca/storage и нажми "Get Started".
   Эта кнопка появится только после перехода на Blaze план.

4. **SendGrid API ключ** — для отправки email:
   - Зарегистрируйся на https://sendgrid.com (бесплатно, 100 писем/день)
   - Создай API ключ в Settings > API Keys
   - Сохрани в Firebase:
     ```bash
     firebase functions:secrets:set SENDGRID_API_KEY
     ```

### Пошаговый деплой

```bash
# 1. Установить зависимости бекенда
cd backend/functions
npm install

# 2. Проверить что код компилируется
npx tsc --noEmit

# 3. Задеплоить всё (из корня проекта)
cd ../..
firebase deploy --only firestore:rules    # правила Firestore
firebase deploy --only storage            # правила Storage
firebase deploy --only functions          # Cloud Functions (самое долгое, ~2 мин)
```

Или одной командой:

```bash
firebase deploy --only functions,firestore:rules,storage
```

### Деплой фронтенда (хостинг)

Если хочешь разместить сайт на Firebase Hosting (не только localhost):

```bash
cd frontend
npm run build       # собрать production-версию
cd ..
firebase deploy --only hosting
```

Сайт будет доступен по адресу: https://abas-d36ca.web.app

### Когда нужен повторный деплой?

- Изменил код в `backend/functions/src/` — деплой `functions`
- Изменил `backend/firestore.rules` — деплой `firestore:rules`
- Изменил `storage.rules` — деплой `storage`
- Изменил фронтенд и хочешь обновить хостинг — деплой `hosting`
- Изменил только фронтенд и тестируешь локально — деплой **не нужен**, просто `npm run dev`

---

## Как это работает (архитектура)

```
Пользователь
    |
    v
Браузер (localhost:3000 или abas-d36ca.web.app)
    |
    v
Next.js фронтенд --- читает/пишет напрямую ---> Firestore (облако Google)
                                                     |
                                                     v
                                              Cloud Functions (бекенд)
                                              срабатывают автоматически:
                                                - новая заявка -> email менеджеру
                                                - новый тикет -> назначить консультанта
                                                - статус "done" -> email пациенту
                                                     |
                                                     v
                                                 SendGrid -> email
```

**Фронтенд** — это сайт в браузере. Он напрямую общается с Firestore (чтение/запись данных) и Firebase Auth (вход/регистрация). Запускается через `npm run dev`.

**Бекенд** — это Cloud Functions на серверах Google. Они НЕ запускаются локально. Они срабатывают автоматически когда что-то происходит в Firestore (новый документ, изменение). Нужен деплой один раз.

**Другому разработчику** нужен только фронтенд (`npm run dev`). Бекенд уже работает в облаке после деплоя.

---

## Структура проекта

```
aimedtour-main/
├── frontend/                    # Next.js приложение
│   ├── app/
│   │   ├── page.tsx             # Главная страница
│   │   ├── about/page.tsx       # О компании
│   │   ├── auth/page.tsx        # Вход / Регистрация
│   │   ├── consult/page.tsx     # Форма заявки на консультацию
│   │   ├── hospitals/page.tsx   # Партнерские больницы
│   │   ├── quiz/page.tsx        # Алгоритм подбора клиник (5 шагов)
│   │   ├── reviews/page.tsx     # Кейсы пациентов
│   │   ├── trip/page.tsx        # Туризм и путешествия
│   │   └── admin-panel/page.tsx # Админка (CRUD туризма)
│   ├── components/              # React компоненты
│   ├── hooks/                   # Хуки (useHospitals, useCases, useTourism, useWizard)
│   ├── context/AuthContext.tsx  # Контекст авторизации
│   └── lib/firebase.ts         # Конфиг Firebase (проект abas-d36ca)
│
├── backend/
│   ├── functions/src/
│   │   ├── index.ts             # Cloud Functions (5 функций)
│   │   ├── consultations.ts     # Логика заявок + назначение консультантов
│   │   └── seed.ts              # Тестовые данные
│   └── firestore.rules          # Правила доступа Firestore
│
├── storage.rules                # Правила Firebase Storage
├── firebase.json                # Конфигурация Firebase
└── backend_audit_report.pdf     # Отчет аудита бекенда
```

---

## Cloud Functions

| Функция | Тип | Описание |
|---------|-----|----------|
| `setUserRole` | onCall | Назначение роли пользователю (только admin) |
| `onNewConsultation` | onDocumentCreated | Email менеджеру + авто-назначение координатора |
| `onNewSupportTicket` | onDocumentCreated | Авто-назначение консультанта на тикет |
| `updateConsultationStatus` | onCall | Смена статуса заявки + email пациенту при done |
| `seedDatabase` | onCall | Заполнение Firestore тестовыми данными |

---

## Роли

| Роль | Назначение | Права |
|------|-----------|-------|
| `user` | При регистрации | Просмотр контента, отправка заявок, алгоритм подбора |
| `consultant` | Через setUserRole | Просмотр/обновление заявок и тикетов |
| `coordinator` | Через setUserRole | То же что consultant |
| `admin` | Через setUserRole | Полный доступ, управление ролями, CRUD контента |

Роли хранятся в Firebase Custom Claims (`request.auth.token.role`).

---

## Коллекции Firestore

| Коллекция | Чтение | Запись |
|-----------|--------|-------|
| `/hospitals` | Все | admin |
| `/diseases` | Все | admin |
| `/cases` | Все | admin |
| `/tourism` | Все | admin |
| `/settings` | Все | admin |
| `/consultations` | admin, consultant | Все (create) |
| `/users` | Свой профиль + admin | Свой профиль |
| `/algorithmResults` | Свои + admin | auth |
| `/supportTickets` | Свои + назначенный + admin | auth |
| `/reviews` | Все | Свои |

---

## Что готово

### Бекенд (10/10)

- [x] Прием заявок на консультацию с email уведомлением
- [x] Firestore Security Rules (Custom Claims)
- [x] Storage Rules (роли, лимит 5МБ, только изображения)
- [x] Email уведомления (менеджеру, консультанту, пациенту)
- [x] Авто-назначение координатора/консультанта (least-loaded)
- [x] Смена статуса заявки (new / in-progress / done)
- [x] Назначение ролей через Custom Claims
- [x] Коллекция болезней (name, nameKo, nameEn, hospitalIds)
- [x] Коллекция больниц (diseaseIds, certifications)
- [x] Seed данные (5 больниц, 8 болезней, 3 кейса, 4 тур. места, 3 консультанта)

### Фронтенд (готово)

- [x] Главная страница (hero, статистика, CTA)
- [x] Авторизация (email, Google, никнейм, регистрация, сброс пароля)
- [x] Форма заявки на консультацию
- [x] Страница больниц
- [x] Страница кейсов пациентов
- [x] Алгоритм подбора клиник (5 шагов, скоринг, топ-3)
- [x] Туризм (герой-секция + карточки по типам)
- [x] Админка: CRUD туризма + герой-секция
- [x] О компании

### Фронтенд (осталось)

- [ ] Защита /admin-panel (проверка роли, редирект)
- [ ] Страница болезней + поиск/фильтрация
- [ ] CRUD болезней в админке
- [ ] CRUD больниц в админке
- [ ] CRUD кейсов в админке
- [ ] Управление заявками в админке (список, смена статуса)
- [ ] Компонент загрузки изображений в Storage
- [ ] Before/after фото в кейсах
- [ ] Связка больниц с болезнями в UI

---

## Частые вопросы

**Мне передали проект. Что делать?**
`cd frontend && npm install && npm run dev` — всё. Сайт на localhost:3000.

**Нужно ли деплоить?**
Нет, если владелец уже сделал деплой. Фронтенд подключается к облаку Firebase автоматически.

**Почему `npx live-server` не работает?**
Это Next.js проект, не статический HTML. Используй `npm run dev`.

**Как добавить себя как админа?**
В Firebase Console > Authentication > найди свой UID. Потом через Firebase Functions Shell или напрямую через Admin SDK вызови `setUserRole({ uid: "...", role: "admin" })`.

**Где менять email менеджера для уведомлений?**
`backend/functions/src/index.ts`, строка 26: `MANAGER_EMAIL`.

---

Smart K-Medi | май 2026
