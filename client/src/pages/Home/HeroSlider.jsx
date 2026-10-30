import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";


const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2400&q=90",
    title: "Wear Your Story",
    subtitle: "Discover timeless essentials designed for your everyday style.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2400&q=90",
    title: "Effortless Elegance",
    subtitle: "Elevated silhouettes. Refined details. Unmistakable style.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2400&q=90",
    title: "Made to Stand Out",
    subtitle: "Express yourself with bold looks and modern essentials.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=2400&q=90",
    title: "The New Classics",
    subtitle: "Versatile pieces. Contemporary fits. Endless possibilities.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2400&q=90",
    title: "Style in Every Season",
    subtitle: "Explore the latest collection and find your signature look.",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const activeSlide = slides[current];

  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);

  return (
    <main className="home-hero">
      <div className="home-hero__media" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`home-hero__slide ${
              index === current ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img src={slide.image} alt="" className="home-hero__image" />
            <div className="home-hero__image-shade" />
          </div>
        ))}
      </div>

      <div className="home-hero__nav">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="home-hero__nav-button"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="home-hero__nav-button"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="home-hero__content">
        <div key={activeSlide.title} className="home-hero__message" aria-live="polite">
          <p className="home-hero__kicker">Prishansh boutique / edit 0{current + 1}</p>
          <h1 className="home-hero__title">
            {activeSlide.title}
          </h1>
          <p className="home-hero__copy">
            {activeSlide.subtitle}
          </p>
          <Link to="/shop" className="home-hero__action">
            Explore the collection <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="home-hero__pagination" aria-label="Choose a campaign image">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              className="home-hero__page-button"
            />
          ))}
        </div>
      </div>

      <p className="home-hero__edition">Selected for the way you live</p>

    </main>
  );
}
