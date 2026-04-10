/**
 * app.js — Smart K-Medi
 * Вся логика: Firebase, Auth, Firestore, Wizard, рендер карточек
 *
 * Этот файл подключён в index.html как <script type="module" src="app.js">
 * ES-модули работают только через http:// (не file://).
 * Запускай через: npx live-server
 */

// ════════════════════════════════════════════════════════
//  FIREBASE IMPORTS (из CDN, без npm и сборщика)
// ════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  updateProfile,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


// ════════════════════════════════════════════════════════
//  КОНФИГУРАЦИЯ FIREBASE
//  Если нужно сменить проект — поменяй значения здесь
// ════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyCL5X6al6p54ELIJmiMeEGGsF2jbVyCRz0",
  authDomain:        "abas-d36ca.firebaseapp.com",
  projectId:         "abas-d36ca",
  storageBucket:     "abas-d36ca.firebasestorage.app",
  messagingSenderId: "727176599054",
  appId:             "1:727176599054:web:b62b3fa544586759958e5f",
  measurementId:     "G-MT5BV0PM64"
};

// ── Инициализация ──
const app            = initializeApp(firebaseConfig);
const auth           = getAuth(app);
const db             = getFirestore(app);
const storage        = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Если нужно тестировать аутентификацию через локальный эмулятор,
// сделайте явно: откройте сайт с `?useEmulator=1` в URL и запустите
// `firebase emulators:start --only auth`.
const useEmulator = new URLSearchParams(location.search).get('useEmulator') === '1';
if (useEmulator && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('Auth emulator connected (http://localhost:9099)');
  } catch (e) {
    console.warn('Auth emulator connection failed:', e);
  }
} else if (useEmulator) {
  console.warn('useEmulator=1 specified but origin is not localhost/127.0.0.1 — skipping emulator connect');
}

// ── Делаем auth, db и storage доступными из HTML-обработчиков (onclick="...") ──
// Это нужно потому что ES-модули изолированы и window не видит их переменные
window._auth    = auth;
window._db      = db;
window._storage = storage;


// ════════════════════════════════════════════════════════
//  AUTH STATE — следим за состоянием входа
//  Автоматически обновляет header при входе/выходе
// ════════════════════════════════════════════════════════
onAuthStateChanged(auth, (user) => {
  const headerAuth = document.getElementById('header-auth');
  const userInfo   = document.getElementById('user-info');
  const nameDisplay = document.getElementById('user-name-display');

  if (user) {
    // Пользователь вошёл — показываем имя и кнопку выхода
    headerAuth.style.display  = 'none';
    userInfo.style.display    = 'flex';
    nameDisplay.textContent   = user.displayName || user.email.split('@')[0];
  } else {
    // Не вошёл — показываем кнопки Войти / Регистрация
    headerAuth.style.display  = 'flex';
    userInfo.style.display    = 'none';
  }
});


// ════════════════════════════════════════════════════════
//  ИНИЦИАЛИЗАЦИЯ: seed данные + загрузка
// ════════════════════════════════════════════════════════
await seedIfEmpty();  // Заполняет Firestore при первом запуске
await loadAll();      // Загружает данные и рисует карточки


// ════════════════════════════════════════════════════════
//  SEED — заполнение Firestore тестовыми данными
//  Запускается только если коллекция пустая (isEmpty)
//  Не перезаписывает существующие данные
// ════════════════════════════════════════════════════════
async function seedIfEmpty() {

  // ── Счётчики для главной страницы ──
  const settingsRef  = doc(db, 'settings', 'main');
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      patients:  1240,
      countries: 28,
      years:     7,
      hospitals: 12
    });
  }

  // ── Больницы ──
  const hospSnap = await getDocs(collection(db, 'hospitals'));
  if (hospSnap.empty) {
    const hospitals = [
      {
        name: 'Asan Medical Center',
        specializations: ['Онкология', 'Кардиология', 'Нейрохирургия'],
        certifications:  ['JCI', 'KOIHA'],
        description: 'Крупнейший медицинский центр Кореи. 2700+ коек, 9000+ персонал.',
        createdAt: serverTimestamp()
      },
      {
        name: 'Seoul National University Hospital',
        specializations: ['Онкология', 'Трансплантология', 'Ортопедия'],
        certifications:  ['JCI'],
        description: 'Ведущий университетский госпиталь с 130-летней историей.',
        createdAt: serverTimestamp()
      },
      {
        name: 'Severance Hospital (Yonsei)',
        specializations: ['Кардиология', 'Неврология', 'Ортопедия'],
        certifications:  ['JCI', 'KOIHA'],
        description: 'Первая западная больница Кореи. Более 100 специальностей.',
        createdAt: serverTimestamp()
      },
      {
        name: 'Samsung Medical Center',
        specializations: ['Онкология', 'Трансплантология'],
        certifications:  ['JCI'],
        description: 'Ведущий частный медицинский центр группы Samsung.',
        createdAt: serverTimestamp()
      },
      {
        name: 'Gangnam Severance Hospital',
        specializations: ['Ортопедия', 'Пластическая хирургия', 'Реабилитация'],
        certifications:  ['KOIHA'],
        description: 'Специализация на ортопедии и восстановительной медицине.',
        createdAt: serverTimestamp()
      },
    ];
    for (const h of hospitals) await addDoc(collection(db, 'hospitals'), h);
  }

  // ── Болезни ──
  const disSnap = await getDocs(collection(db, 'diseases'));
  if (disSnap.empty) {
    const diseases = [
      { name: 'Рак желудка',            nameEn: 'Gastric Cancer',         category: 'Онкология',             keywords: ['рак', 'желудок', 'онкология', 'опухоль'] },
      { name: 'Рак лёгких',             nameEn: 'Lung Cancer',            category: 'Онкология',             keywords: ['рак', 'лёгкие', 'онкология'] },
      { name: 'Инфаркт миокарда',       nameEn: 'Myocardial Infarction',  category: 'Кардиология',           keywords: ['инфаркт', 'сердце', 'кардио'] },
      { name: 'Артроз коленного сустава',nameEn: 'Knee Osteoarthritis',   category: 'Ортопедия',             keywords: ['артроз', 'колено', 'сустав', 'ортопедия'] },
      { name: 'Инсульт',                nameEn: 'Stroke',                 category: 'Неврология',            keywords: ['инсульт', 'мозг', 'неврология'] },
      { name: 'Трансплантация почки',   nameEn: 'Kidney Transplant',      category: 'Трансплантология',      keywords: ['почка', 'трансплантация', 'пересадка'] },
      { name: 'Пластика носа',          nameEn: 'Rhinoplasty',            category: 'Пластическая хирургия', keywords: ['нос', 'пластика', 'ринопластика'] },
      { name: 'Лечение позвоночника',   nameEn: 'Spine Treatment',        category: 'Ортопедия',             keywords: ['позвоночник', 'спина', 'грыжа'] },
    ];
    for (const d of diseases) {
      await addDoc(collection(db, 'diseases'), { ...d, createdAt: serverTimestamp() });
    }
  }

  // ── Кейсы пациентов ──
  const casesSnap = await getDocs(collection(db, 'cases'));
  if (casesSnap.empty) {
    const cases = [
      {
        patientName: 'Алия М.',
        country:     '🇰🇬 Кыргызстан',
        disease:     'Рак желудка',
        result:      'Полная ремиссия после 6 месяцев терапии в Asan Medical Center',
        testimonial: 'Корейские врачи спасли мою жизнь. Сервис на высшем уровне, всё объяснили на русском языке.',
        createdAt: serverTimestamp()
      },
      {
        patientName: 'Ержан С.',
        country:     '🇰🇿 Казахстан',
        disease:     'Артроз колена',
        result:      'Эндопротезирование обоих колен. Через 3 месяца хожу без боли.',
        testimonial: 'Операция прошла идеально. Реабилитация была включена в программу.',
        createdAt: serverTimestamp()
      },
      {
        patientName: 'Анна К.',
        country:     '🇷🇺 Россия',
        disease:     'Инфаркт',
        result:      'Стентирование коронарных артерий. Выписан через 5 дней.',
        testimonial: 'Скорость реакции и качество оборудования — недостижимы у нас.',
        createdAt: serverTimestamp()
      },
    ];
    for (const c of cases) await addDoc(collection(db, 'cases'), c);
  }

  // ── Туристические места ──
  const tourSnap = await getDocs(collection(db, 'tourism'));
  if (tourSnap.empty) {
    const places = [
      { type: 'sights',   name: 'Дворец Кёнбоккун', description: 'Главный королевский дворец эпохи Чосон в центре Сеула.', location: 'Сеул, Чонно',  createdAt: serverTimestamp() },
      { type: 'shopping', name: 'Myeongdong',        description: 'Главный торговый район Сеула. Косметика, мода, уличная еда.', location: 'Сеул, Чун', createdAt: serverTimestamp() },
      { type: 'food',     name: 'Gwangjang Market',  description: 'Старейший рынок Кореи. Биндэтток, юккедян, живые устрицы.', location: 'Сеул, Чонно', createdAt: serverTimestamp() },
      { type: 'sights',   name: 'Namsan Tower',      description: 'Телебашня Н-Сеул на горе Намсан. Вид на весь Сеул.', location: 'Сеул, Ёнсан',      createdAt: serverTimestamp() },
    ];
    for (const p of places) await addDoc(collection(db, 'tourism'), p);
  }
}


// ════════════════════════════════════════════════════════
//  FE-06 — АНИМИРОВАННЫЕ СЧЁТЧИКИ
//  Считает от 0 до targetValue за duration миллисекунд (~60fps)
// ════════════════════════════════════════════════════════
function animateCounter(elementId, targetValue, duration = 1500) {
  const el = document.getElementById(elementId);
  if (!el || !targetValue) return;
  const step = targetValue / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= targetValue) {
      el.textContent = Number(targetValue).toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString();
    }
  }, 16);
}


// ════════════════════════════════════════════════════════
//  ЗАГРУЗКА ДАННЫХ — читает из Firestore и рисует карточки
// ════════════════════════════════════════════════════════
async function loadAll() {

  // Счётчики на главной — FE-06: анимированный отсчёт
  const settingsSnap = await getDoc(doc(db, 'settings', 'main'));
  if (settingsSnap.exists()) {
    const s = settingsSnap.data();
    animateCounter('cnt-patients',  s.patients,  1500);
    animateCounter('cnt-countries', s.countries, 800);
    animateCounter('cnt-hospitals', s.hospitals, 600);
  }

  // Больницы
  const hospSnap = await getDocs(collection(db, 'hospitals'));
  window._hospitalsData = [];
  hospSnap.forEach(d => window._hospitalsData.push({ id: d.id, ...d.data() }));
  renderHospitals(window._hospitalsData);

  // Болезни (сохраняем в window для поиска)
  const disSnap = await getDocs(collection(db, 'diseases'));
  window._diseasesData = [];
  disSnap.forEach(d => window._diseasesData.push({ id: d.id, ...d.data() }));
  renderDiseases(window._diseasesData);

  // Кейсы
  const casesSnap = await getDocs(collection(db, 'cases'));
  const casesData = [];
  casesSnap.forEach(d => casesData.push({ id: d.id, ...d.data() }));
  renderCases(casesData);

  // Туризм
  const tourSnap = await getDocs(collection(db, 'tourism'));
  const tourData = [];
  tourSnap.forEach(d => tourData.push({ id: d.id, ...d.data() }));
  renderTourism(tourData);
}


// ════════════════════════════════════════════════════════
//  RENDER ФУНКЦИИ — превращают данные в HTML карточки
// ════════════════════════════════════════════════════════

function renderHospitals(data) {
  const el = document.getElementById('hospitals-list');
  if (!data.length) { el.innerHTML = '<p style="color:var(--muted)">Нет данных</p>'; return; }
  el.innerHTML = data.map(h => `
    <div class="card">
      <h3>🏥 ${h.name}</h3>
      <p>${h.description || ''}</p>
      <div>${(h.specializations || []).map(s => `<span class="tag">${s}</span>`).join('')}</div>
      <div style="margin-top:8px">${(h.certifications || []).map(c => `<span class="tag teal">${c}</span>`).join('')}</div>
    </div>
  `).join('');
}

function renderDiseases(data) {
  const el = document.getElementById('diseases-list');
  if (!data.length) { el.innerHTML = '<p style="color:var(--muted)">Нет данных</p>'; return; }
  el.innerHTML = data.map(d => `
    <div class="card">
      <span class="tag gray" style="margin-bottom:8px;display:inline-block">${d.category || ''}</span>
      <h3>${d.name}</h3>
      <p style="font-size:12px;color:var(--muted)">${d.nameEn || ''}</p>
    </div>
  `).join('');
}

function renderCases(data) {
  const el = document.getElementById('cases-list');
  if (!data.length) { el.innerHTML = '<p style="color:var(--muted)">Нет данных</p>'; return; }
  el.innerHTML = data.map(c => `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:24px">👤</span>
        <div>
          <strong>${c.patientName || 'Аноним'}</strong><br>
          <small style="color:var(--muted)">${c.country || ''}</small>
        </div>
      </div>
      <span class="tag" style="margin-bottom:8px">${c.disease || ''}</span>
      <p>${c.result || ''}</p>
      <blockquote style="border-left:3px solid var(--blue);padding-left:10px;margin-top:10px;font-style:italic;font-size:13px;color:var(--muted)">
        "${c.testimonial || ''}"
      </blockquote>
    </div>
  `).join('');
}

function renderTourism(data) {
  const typeIcon  = { sights: '🗿', shopping: '🛍️', food: '🍜' };
  const typeLabel = { sights: 'Достопримечательность', shopping: 'Шопинг', food: 'Еда' };
  const el = document.getElementById('tourism-list');
  if (!data.length) { el.innerHTML = '<p style="color:var(--muted)">Нет данных</p>'; return; }
  el.innerHTML = data.map(t => `
    <div class="card">
      <div style="font-size:28px;margin-bottom:8px">${typeIcon[t.type] || '📍'}</div>
      <span class="tag gray" style="margin-bottom:8px;display:inline-block">${typeLabel[t.type] || t.type}</span>
      <h3>${t.name}</h3>
      <p>${t.description || ''}</p>
      <small style="color:var(--muted)">📍 ${t.location || ''}</small>
    </div>
  `).join('');
}

// ── Фильтрация болезней по поисковой строке ──
// Вызывается из HTML: oninput="filterDiseases()"
window.filterDiseases = function() {
  const q = document.getElementById('disease-search').value.toLowerCase();
  const filtered = (window._diseasesData || []).filter(d =>
    d.name?.toLowerCase().includes(q) ||
    (d.keywords || []).some(k => k.toLowerCase().includes(q))
  );
  renderDiseases(filtered);
};


// ════════════════════════════════════════════════════════
//  НАВИГАЦИЯ МЕЖДУ СТРАНИЦАМИ
// ════════════════════════════════════════════════════════
window.showPage = function(id, btn) {
  // Убираем активный класс со всех страниц и кнопок
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  // Показываем нужную страницу
  document.getElementById(id).classList.add('active');
  if (btn) btn.classList.add('active');
  // При переходе на алгоритм — инициализируем визард
  if (id === 'algo') initWizard();
};


// ════════════════════════════════════════════════════════
//  МОДАЛЬНЫЕ ОКНА
// ════════════════════════════════════════════════════════
window.openModal = function(type) {
  document.getElementById(`modal-${type}`).classList.add('open');
};

window.closeModal = function(type) {
  document.getElementById(`modal-${type}`).classList.remove('open');
  // Очищаем алерты при закрытии
  const alertEl = document.getElementById(`${type}-alert`);
  if (alertEl) alertEl.innerHTML = '';
};

window.switchModal = function(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 100);
};

// Закрытие по клику на тёмный фон
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      const id = this.id.replace('modal-', '');
      closeModal(id);
    }
  });
});

// Закрытие по Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      closeModal(m.id.replace('modal-', ''));
    });
  }
});


// ════════════════════════════════════════════════════════
//  AUTH: ВХОД (email + пароль)
// ════════════════════════════════════════════════════════
window.loginUser = async function() {
  const email   = document.getElementById('login-email').value.trim();
  const pass    = document.getElementById('login-pass').value;
  const alertEl = document.getElementById('login-alert');
  alertEl.innerHTML = '';

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal('login');
  } catch(e) {
    let msg = 'Ошибка входа';
    if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(e.code))
      msg = 'Неверный email или пароль';
    else if (e.code === 'auth/invalid-email')
      msg = 'Некорректный email';
    alertEl.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  }
};


// ════════════════════════════════════════════════════════
//  AUTH: РЕГИСТРАЦИЯ (ник + email + пароль)
// ════════════════════════════════════════════════════════
window.registerUser = async function() {
  const nick    = document.getElementById('reg-nick').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const pass    = document.getElementById('reg-pass').value;
  const alertEl = document.getElementById('register-alert');
  alertEl.innerHTML = '';

  // Базовая валидация
  if (!nick)         { alertEl.innerHTML = '<div class="alert alert-error">Введите никнейм</div>'; return; }
  if (!email)        { alertEl.innerHTML = '<div class="alert alert-error">Введите email</div>'; return; }
  if (pass.length < 6) { alertEl.innerHTML = '<div class="alert alert-error">Пароль минимум 6 символов</div>'; return; }

  try {
    // Проверяем, не занят ли email
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      alertEl.innerHTML = '<div class="alert alert-error">Аккаунт с таким email уже существует</div>';
      return;
    }

    // Создаём пользователя
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Устанавливаем никнейм как displayName
    await updateProfile(cred.user, { displayName: nick });

    // Сохраняем профиль в Firestore /users/{uid}
    await setDoc(doc(db, 'users', cred.user.uid), {
      nickname:  nick,
      email:     email,
      createdAt: serverTimestamp()
    });

    closeModal('register');

  } catch(e) {
    let msg = 'Ошибка регистрации';
    if (e.code === 'auth/email-already-in-use') msg = 'Аккаунт с таким email уже существует';
    else if (e.code === 'auth/invalid-email')   msg = 'Некорректный email';
    else if (e.code === 'auth/weak-password')   msg = 'Слишком слабый пароль';
    alertEl.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  }
};


// ════════════════════════════════════════════════════════
//  AUTH: ВХОД ЧЕРЕЗ GOOGLE
// ════════════════════════════════════════════════════════
window.loginGoogle = async function() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user   = result.user;

    // Сохраняем / обновляем профиль в Firestore (merge: не перезаписывает)
    await setDoc(doc(db, 'users', user.uid), {
      nickname:  user.displayName,
      email:     user.email,
      createdAt: serverTimestamp()
    }, { merge: true });

    closeModal('login');
    closeModal('register');

  } catch(e) {
    console.error('Google login error:', e);
  }
};


// ════════════════════════════════════════════════════════
//  AUTH: ВЫХОД
// ════════════════════════════════════════════════════════
window.logout = async function() {
  await signOut(auth);
};


// ════════════════════════════════════════════════════════
//  ФОРМА КОНСУЛЬТАЦИИ — сохраняет заявку в Firestore
// ════════════════════════════════════════════════════════
window.submitConsultation = async function() {
  const name    = document.getElementById('c-name').value.trim();
  const email   = document.getElementById('c-email').value.trim();
  const alertEl = document.getElementById('consult-alert');

  if (!name || !email) {
    alertEl.innerHTML = '<div class="alert alert-error">Заполните обязательные поля (имя и email)</div>';
    return;
  }

  try {
    // Сохраняем в /consultations со статусом 'new'
    await addDoc(collection(db, 'consultations'), {
      name,
      email,
      phone:    document.getElementById('c-phone').value,
      country:  document.getElementById('c-country').value,
      disease:  document.getElementById('c-disease').value,
      message:  document.getElementById('c-message').value,
      status:   'new',   // new → in-progress → done (меняется в Админке)
      createdAt: serverTimestamp()
    });

    alertEl.innerHTML = '<div class="alert alert-success">✅ Заявка отправлена! Менеджер свяжется с вами в течение 24 часов.</div>';

    // Очищаем форму
    ['c-name', 'c-email', 'c-phone', 'c-disease', 'c-message'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('c-country').value = '';

  } catch(e) {
    alertEl.innerHTML = '<div class="alert alert-error">Ошибка отправки. Попробуйте снова.</div>';
  }
};


// ════════════════════════════════════════════════════════
//  АЛГОРИТМ ПОДБОРА (ВИЗАРД)
//  5 шагов → результат: топ-3 клиники из Firestore
// ════════════════════════════════════════════════════════

// Данные шагов опросника
const WIZARD_STEPS = [
  {
    id: 'category',
    q: 'Какое направление медицины вас интересует?',
    sub: 'Выберите наиболее подходящую область',
    options: [
      { icon: '🎗️', label: 'Онкология' },
      { icon: '❤️',  label: 'Кардиология' },
      { icon: '🦴',  label: 'Ортопедия' },
      { icon: '🧠',  label: 'Неврология' },
      { icon: '🔬',  label: 'Трансплантология' },
      { icon: '💉',  label: 'Пластическая хирургия' },
    ]
  },
  {
    id: 'urgency',
    q: 'Насколько срочно нужна помощь?',
    sub: 'Это влияет на приоритет подбора',
    options: [
      { icon: '🚨', label: 'Срочно (в течение месяца)' },
      { icon: '📅', label: 'В ближайшие 3 месяца' },
      { icon: '🗓️', label: 'В течение полугода' },
      { icon: '🤔', label: 'Пока изучаю варианты' },
    ]
  },
  {
    id: 'budget',
    q: 'Какой примерный бюджет на лечение?',
    sub: 'Без учёта перелёта и проживания',
    options: [
      { icon: '💵', label: 'До $5,000' },
      { icon: '💴', label: '$5,000 — $15,000' },
      { icon: '💶', label: '$15,000 — $30,000' },
      { icon: '💷', label: 'Свыше $30,000' },
    ]
  },
  {
    id: 'lang',
    q: 'Нужен ли переводчик / сопровождение?',
    sub: 'Мы обеспечиваем полное сопровождение',
    options: [
      { icon: '🌐', label: 'Да, нужен русскоязычный координатор' },
      { icon: '🗣️', label: 'Говорю по-английски — переводчик не нужен' },
      { icon: '✈️', label: 'Нужна помощь с визой и перелётом' },
      { icon: '🏠', label: 'Нужно помочь с жильём рядом с клиникой' },
    ]
  },
  {
    id: 'cert',
    q: 'Важна ли международная аккредитация?',
    sub: 'JCI — самый строгий международный стандарт',
    options: [
      { icon: '🏆', label: 'Только JCI-аккредитованные' },
      { icon: '✅', label: 'JCI или KOIHA — любая аккредитация' },
      { icon: '🎯', label: 'Главное — специализация, не сертификат' },
      { icon: '❓', label: 'Не знаю, что выбрать' },
    ]
  },
];

let wizardAnswers = {};  // Хранит ответы пользователя: { category: '...', urgency: '...', ... }
let wizardStep    = 0;   // Текущий шаг (0–4)

// Запускает визард заново (сбрасывает ответы)
window.initWizard = function() {
  wizardAnswers = {};
  wizardStep    = 0;
  renderWizard();
};

// Рисует текущий шаг визарда
window.renderWizard = function() {
  const container = document.getElementById('wizard-container');

  // Если все шаги пройдены — показываем результат
  if (wizardStep >= WIZARD_STEPS.length) {
    renderResult(container);
    return;
  }

  const step = WIZARD_STEPS[wizardStep];

  // Прогресс-бар (точки с линиями)
  const progressDots = WIZARD_STEPS.map((_, i) => {
    const cls = i < wizardStep ? 'done' : i === wizardStep ? 'current' : '';
    const line = i > 0 ? `<div class="wizard-line ${i <= wizardStep ? 'done' : ''}"></div>` : '';
    const label = i < wizardStep ? '✓' : i + 1;
    return `${line}<div class="wizard-step-dot ${cls}">${label}</div>`;
  }).join('');

  container.innerHTML = `
    <div class="wizard-progress">${progressDots}</div>
    <div class="wizard-card">
      <h2>${step.q}</h2>
      <div class="q-sub">${step.sub}</div>
      <div class="options-grid">
        ${step.options.map(o => `
          <button
            class="option-btn ${wizardAnswers[step.id] === o.label ? 'selected' : ''}"
            onclick="selectOption('${step.id}', '${o.label.replace(/'/g, "\\'")}', this)"
          >
            <span class="opt-icon">${o.icon}</span>
            <span>${o.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="wizard-nav">
        ${wizardStep > 0
          ? `<button class="btn btn-outline" onclick="wizardBack()">← Назад</button>`
          : '<span></span>'
        }
        <span>Шаг ${wizardStep + 1} из ${WIZARD_STEPS.length}</span>
        <button
          class="btn btn-primary"
          onclick="wizardNext()"
          ${!wizardAnswers[step.id] ? 'disabled style="opacity:.5;cursor:default"' : ''}
        >
          ${wizardStep === WIZARD_STEPS.length - 1 ? 'Показать результат →' : 'Далее →'}
        </button>
      </div>
    </div>
  `;
};

// Выбор варианта ответа
window.selectOption = function(stepId, label, btn) {
  wizardAnswers[stepId] = label;
  // Убираем selected у всех, добавляем выбранному
  btn.closest('.options-grid').querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  // Активируем кнопку "Далее"
  const nextBtn = btn.closest('.wizard-card').querySelector('.wizard-nav .btn-primary');
  if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = '1'; nextBtn.style.cursor = 'pointer'; }
};

window.wizardNext = function() {
  if (!wizardAnswers[WIZARD_STEPS[wizardStep].id]) return;
  wizardStep++;
  renderWizard();
};

window.wizardBack = function() {
  if (wizardStep > 0) { wizardStep--; renderWizard(); }
};



// ════════════════════════════════════════════════════════
//  BE-08 — FIREBASE STORAGE: загрузка фото
//  Используется в Админке для фото больниц и кейсов
//  uploadPhoto(file, 'cases/before') → возвращает URL
// ════════════════════════════════════════════════════════
window.uploadPhoto = async function(file, path) {
  if (!auth.currentUser) throw new Error('Необходима авторизация');
  const storageRef = ref(storage, `images/${path}/${Date.now()}_${file.name}`);
  const snapshot   = await uploadBytes(storageRef, file);
  const url        = await getDownloadURL(snapshot.ref);
  return url;  // сохрани этот URL в Firestore (поле beforeImg / afterImg / logoUrl)
};

// Удобная обёртка: вешается на <input type="file"> и сразу загружает
// Пример: <input type="file" onchange="handlePhotoUpload(event, 'cases/before', 'DOCUMENT_ID')">
window.handlePhotoUpload = async function(event, storagePath, docId, collection_, field) {
  const file    = event.target.files[0];
  if (!file) return;
  const label   = event.target.closest('label') || event.target;
  label.textContent = '⏳ Загрузка...';
  try {
    const url = await window.uploadPhoto(file, storagePath);
    // Сохраняем URL в нужный документ Firestore
    await updateDoc(doc(db, collection_, docId), { [field]: url });
    label.textContent = '✅ Загружено';
  } catch(e) {
    label.textContent = '❌ Ошибка загрузки';
    console.error(e);
  }
};


// ════════════════════════════════════════════════════════
//  BE-10 — СМЕНА СТАТУСОВ ЗАЯВОК
//  Используется в admin.html
//  changeConsultationStatus(id, 'in-progress')
// ════════════════════════════════════════════════════════
window.changeConsultationStatus = async function(id, newStatus) {
  const allowed = ['new', 'in-progress', 'done'];
  if (!allowed.includes(newStatus)) throw new Error(`Недопустимый статус: ${newStatus}`);
  if (!auth.currentUser) throw new Error('Необходима авторизация');
  await updateDoc(doc(db, 'consultations', id), { status: newStatus });
};

// Загружает все заявки (только для авторизованных менеджеров)
window.loadConsultations = async function() {
  if (!auth.currentUser) throw new Error('Необходима авторизация');
  const snap = await getDocs(collection(db, 'consultations'));
  const result = [];
  snap.forEach(d => result.push({ id: d.id, ...d.data() }));
  // Сортируем: сначала новые, потом in-progress, потом done
  const order = { 'new': 0, 'in-progress': 1, 'done': 2 };
  result.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  return result;
};

function renderResult(container) {
  const hospitals = window._hospitalsData || [];
  const cat  = wizardAnswers['category'] || '';
  const cert = wizardAnswers['cert'] || '';

  // Считаем score для каждой больницы
  let matches = hospitals.map(h => {
    let score = 0;
    // +40 если специализация совпадает с выбранной категорией
    if ((h.specializations || []).some(s => s.toLowerCase().includes(cat.toLowerCase().split(' ')[0]))) score += 40;
    // +30 если пользователь хочет JCI и больница имеет JCI
    if (cert.includes('JCI')   && (h.certifications || []).includes('JCI'))   score += 30;
    // +20 если пользователь хочет KOIHA и больница имеет KOIHA
    if (cert.includes('KOIHA') && (h.certifications || []).includes('KOIHA')) score += 20;
    // +10 бонус за любую аккредитацию
    if ((h.certifications || []).length > 0) score += 10;
    return { ...h, score };
  });

  matches.sort((a, b) => b.score - a.score);
  const top = matches.slice(0, 3);

  // Если пользователь вошёл — сохраняем результат в Firestore
  if (auth.currentUser) {
    addDoc(collection(db, 'algorithmResults'), {
      userId:       auth.currentUser.uid,
      answers:      wizardAnswers,
      topHospitals: top.map(h => h.name),
      createdAt:    serverTimestamp()
    }).catch(console.error);
  }

  container.innerHTML = `
    <div class="result-hero">
      <div class="result-icon">🎯</div>
      <h2>Ваши топ-3 клиники</h2>
      <p>На основе ваших ответов алгоритм подобрал лучшие варианты</p>
    </div>
    ${top.map((h, i) => `
      <div class="result-match">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <h3>${['🥇','🥈','🥉'][i]} ${h.name}</h3>
          <span class="match-score">Совпадение ${Math.min(95 - i * 12, 99)}%</span>
        </div>
        <div style="margin-bottom:8px">
          ${(h.certifications || []).map(c => `<span class="tag teal">${c}</span>`).join('')}
        </div>
        <div style="margin-bottom:8px">
          ${(h.specializations || []).map(s => `<span class="tag">${s}</span>`).join('')}
        </div>
        <p>${h.description || ''}</p>
      </div>
    `).join('')}
    <div style="text-align:center;margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="showPage('consult', document.querySelectorAll('nav button')[6])">
        💬 Записаться на консультацию
      </button>
      <button class="btn btn-outline" onclick="initWizard()">🔄 Пройти заново</button>
    </div>
  `;
}
