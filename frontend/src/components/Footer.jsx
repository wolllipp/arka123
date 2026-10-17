import { Mark } from "./Mark";
import { PHONE } from "../data/content";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__logo">
            <Mark />
            <div className="footer__slogan">АРКА 123<br /><span className="muted" style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-.01em" }}>Встречаемся напротив Библиотеки.</span></div>
          </div>
          <div className="footer__cols">
            <div><b>Пространство</b><a href="#about">О зале</a><a href="#room">Зал в 3D</a><a href="#gallery">Галерея</a></div>
            <div><b>Аренда</b><a href="#formats">Форматы</a><a href="#tariffs">Тарифы</a><a href="#book">Бронирование</a></div>
            <div><b>Связь</b><a href={PHONE.href}>{PHONE.text}</a><a href="#place">Как добраться</a></div>
          </div>
        </div>
        <div className="footer__bottom"><span>© 2026 АРКА 123</span><span>Демо-макет · вымышленная компания</span></div>
      </div>
    </footer>
  );
}
