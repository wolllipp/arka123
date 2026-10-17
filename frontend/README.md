# АРКА 123 — фронтенд

React 19 · Vite 8 · react-router 7 · GSAP 3 (ScrollTrigger, ScrollTo, @gsap/react) · Three.js 0.169.

```bash
npm install
npm run dev       # http://127.0.0.1:8123 (этот адрес разрешён в CORS бэкенда)
npm run build     # сборка в dist/
npm run lint
```

API бронирования — `../arka-backend` на `http://127.0.0.1:8090/api`; другой адрес задаётся через `VITE_API_URL` (см. `.env.example`).

## Структура

- `src/pages/HomePage.jsx` — лендинг из секций
- `src/pages/BookingPage.jsx` — страница брони `/booking/:code` (ссылка из письма): детали и отмена
- `src/pages/AdminPage.jsx`, `AdminLoginPage.jsx` — панель администратора `/admin`: сводка, фильтры, поиск, подтверждение и отмена броней; `src/admin/auth.js` — сессия (JWT) и запросы к `/api/admin/**`
- `src/components/` — секции: `Hero` (раскрытие окна на скролле), `About`, `RoomSection`, `Formats`, `Tariffs`, `Gallery`, `Reviews`, `Booking`, `Place`, `Footer`; `Preloader` и `Nav`
- `src/components/booking/` — бронирование: календарь на 90 дней, часы из API, цена с сервера, форма, экран успеха; `WaitOverlay` — ожидание вместо спиннера
- `src/lib/booking.js` — общее для виджета и страницы брони: правило отмены за сутки, .ics «в календарь», выбор тарифа из блока «Тарифы»; `src/components/ConfirmDialog.jsx` — подтверждение отмены (гость и админка)
- `src/three/createRoom.js` — 3D-зал (Three.js): срез стен, 4 рассадки, день/закат, вид изнутри; грузится отдельным чанком
- `src/lib/markAnimation.js` — прорисовка знака по кривой из ролика (запасной лоадер и ховер логотипа)
- `src/styles/global.css` — «арочная» дизайн-система: токены и компоненты
- `public/assets/` — сжатые фото, текстура вида из окна, ролики прелоадера (`intro.mp4`) и ожидания (`wait-loop.mp4`), кадры видео-фона (`film/`), вырезанный персонаж (`character/`)

## Инструменты

- `tools/build-film.py` — видео-фон первого экрана: пролёт по фото зала + клип с персонажем → `public/assets/film/` (кадры и `manifest.json`, в нём и длина прокрутки `screens`)
- `tools/film-to-frames.sh` — то же для готового цельного ролика
- `tools/cutout.swift` — вырезать персонажа из фона (Vision, macOS 14+)

Отзывы — демо-данные. Слоты, цены и брони — настоящие, из бэкенда.
