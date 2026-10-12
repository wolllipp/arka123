import { useEffect, useState } from "react";
import { useGSAP } from "../lib/gsap";
import { enableSmoothAnchors, revealOnScroll } from "../lib/pageEffects";
import Preloader from "../components/Preloader";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import About from "../components/About";
import RoomSection from "../components/RoomSection";
import Formats from "../components/Formats";
import Tariffs from "../components/Tariffs";
import Gallery from "../components/Gallery";
import Reviews from "../components/Reviews";
import Booking from "../components/Booking";
import Place from "../components/Place";
import Footer from "../components/Footer";

export default function HomePage() {
  const [ready, setReady] = useState(false);

  useEffect(enableSmoothAnchors, []);
  useGSAP(revealOnScroll);

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Nav />
      <main id="top">
        <Hero ready={ready} />
        <About />
        <RoomSection />
        <Formats />
        <Tariffs />
        <Gallery />
        <Reviews />
        <Booking />
        <Place />
      </main>
      <Footer />
    </>
  );
}
