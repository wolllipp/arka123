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
- `src/components/` — секции: `Hero` (раскрытие окна на скролле), `About`, `RoomSection`, `Formats`, `Tariffs`, `Gallery`, `Reviews`, `Booking`, `Place`, `Footer`; `Preloader` и `Nav`
- `src/components/booking/` — бронирование: дни и часы из API, цена с сервера, форма, отмена по коду; `WaitOverlay` — ожидание вместо спиннера
- `src/three/createRoom.js` — 3D-зал (Three.js): срез стен, 4 рассадки, день/закат, вид изнутри; грузится отдельным чанком
- `src/lib/markAnimation.js` — прорисовка знака по кривой из ролика (запасной лоадер и ховер логотипа)
- `src/styles/global.css` — «арочная» дизайн-система: токены и компоненты
- `public/assets/` — сжатые фото, текстура вида из окна, ролики прелоадера (`intro.mp4`) и ожидания (`wait-loop.mp4`)

Отзывы — демо-данные. Слоты, цены и брони — настоящие, из бэкенда.
