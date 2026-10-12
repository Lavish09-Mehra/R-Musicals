import LogoImage from '../HomeImages/ChatGPT Image Oct 12, 2026, 07_10_34 PM.png';
import GuitarWallImg from '../HomeImages/Img08.jpg';
import CongaImg from '../HomeImages/image04.jpg';
import SitarImg from '../HomeImages/Img06.jpg';
import DholImg from '../HomeImages/Dhol_Img.jpg';
import SeeMoreImg from '../HomeImages/SeeMore.jpg';
import '../Styles/homepage.css';
import { HeaderHomePage } from '../Components/header.tsx';
import { HomePageFooter } from '../Components/footer.tsx';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDE_INTERVAL = 3500; // ms per slide

const SLIDES = [
  { src: LogoImage, alt: 'R Musicals brand artwork' },
  { src: GuitarWallImg, alt: 'Wall of electric guitars in the shop' },
  { src: CongaImg, alt: 'Percussionist playing conga drums' },
  { src: SitarImg, alt: 'Musician playing the sitar' },
  { src: DholImg, alt: 'Image of Traditional Dhol' },
  { src: SeeMoreImg, alt: 'See more instruments' }
];

const SLIDE_COUNT = SLIDES.length;

function HomePage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Respect the OS motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const autoplayOn = !hovering && !reducedMotion;

  // Advance one slide every 3.5s
  useEffect(() => {
    if (!autoplayOn) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDE_COUNT);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [autoplayOn]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % SLIDE_COUNT);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT);
      if (e.key === 'Home') setIndex(0);
      if (e.key === 'End') setIndex(SLIDE_COUNT - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <HeaderHomePage />

      <section
        role="region"
        aria-roledescription="carousel"
        aria-label="Instrument showcase"
        className="hero"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* sliding track — all slides in a row, translated by index */}
        <div
          className="hero__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <button
              key={i}
              type="button"
              className="hero__slide"
              style={{ backgroundImage: `url(${slide.src})` }}
              onClick={() => navigate('/products')}
              aria-label={`${slide.alt} — view all products`}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
            />
          ))}
        </div>

        {/* dark scrim so dots stay readable on any photo */}
        <div className="hero__scrim" aria-hidden="true" />

        {/* plain dot navigation */}
        <nav aria-label="Slide navigation" className="hero__nav">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={index === i ? 'dot dot--active' : 'dot'}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={index === i}
              onClick={() => setIndex(i)}
            />
          ))}
        </nav>
      </section>

      <HomePageFooter />
    </>
  );
}

export default HomePage;