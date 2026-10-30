import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
const looks = [
  {
    title: "The Modern Muse",
    category: "WOMEN",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&h=1200&q=90",
    link: "/category/womens",
  },
  {
    title: "Urban Gentleman",
    category: "MENSWEAR",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&h=1200&q=90",
    link: "/category/mens",
  },
  {
    title: "Street Culture",
    category: "STREETWEAR",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&h=1200&q=90",
    link: "/category/t-shirts",
  },
  {
    title: "Effortless Ethnic",
    category: "ETHNIC WEAR",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&h=1200&q=90",
    link: "/category/ethnic",
  },
  {
    title: "The Denim Edit",
    category: "DENIM",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&h=1200&q=90",
    link: "/category/jeans",
  },
  {
    title: "Evening Elegance",
    category: "OCCASIONWEAR",
    image:
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&h=1200&q=90",
    link: "/category/dresses",
  },
];

export default function CuratedLooks() {
    const sliderRef = useRef(null);
    const animationRef = useRef(null);
    const pointerStartRef = useRef(null);
    const draggedRef = useRef(false);
    const [navigation, setNavigation] = useState({ canGoBack: false, canGoForward: false });

    useEffect(() => () => {
        if (animationRef.current) {
            window.cancelAnimationFrame(animationRef.current);
        }
    }, []);

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return undefined;

        const updateNavigation = () => {
            const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
            const nextNavigation = {
                canGoBack: slider.scrollLeft > 1,
                canGoForward: slider.scrollLeft < maxScroll - 1,
            };

            setNavigation((current) =>
                current.canGoBack === nextNavigation.canGoBack &&
                current.canGoForward === nextNavigation.canGoForward
                    ? current
                    : nextNavigation,
            );
        };

        updateNavigation();
        slider.addEventListener("scroll", updateNavigation, { passive: true });
        window.addEventListener("resize", updateNavigation);

        const resizeObserver =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(updateNavigation);
        resizeObserver?.observe(slider);

        return () => {
            slider.removeEventListener("scroll", updateNavigation);
            window.removeEventListener("resize", updateNavigation);
            resizeObserver?.disconnect();
        };
    }, []);

    const scroll = (direction) => {
        const slider = sliderRef.current;
        if (!slider) return;

        const start = slider.scrollLeft;
        const target = Math.max(
            0,
            Math.min(
                start + direction * slider.clientWidth * 0.68,
                slider.scrollWidth - slider.clientWidth,
            ),
        );
        const distance = target - start;
        const duration = 360;

        if (distance === 0) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            slider.scrollLeft = target;
            return;
        }

        if (animationRef.current) {
            window.cancelAnimationFrame(animationRef.current);
        }

        const startedAt = performance.now();
        const easeOutQuint = (progress) => 1 - Math.pow(1 - progress, 5);

        const animate = (now) => {
            const elapsed = Math.min((now - startedAt) / duration, 1);
            slider.scrollLeft = start + distance * easeOutQuint(elapsed);

            if (elapsed < 1) {
                animationRef.current = window.requestAnimationFrame(animate);
            } else {
                animationRef.current = null;
            }
        };

        animationRef.current = window.requestAnimationFrame(animate);
    };

    const handlePointerDown = (event) => {
        pointerStartRef.current = event.clientX;
        draggedRef.current = false;
    };

    const handlePointerMove = (event) => {
        if (pointerStartRef.current === null) return;
        if (Math.abs(event.clientX - pointerStartRef.current) > 8) {
            draggedRef.current = true;
        }
    };

    const preventDragClick = (event) => {
        if (!draggedRef.current) return;
        event.preventDefault();
        draggedRef.current = false;
    };

    const controlClass =
        "flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-[background-color,color,transform,opacity] duration-200 hover:bg-[#5433eb] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-neutral-900";

    return (
        <section className="overflow-hidden bg-[#f2f4f5] py-14 sm:py-16" aria-labelledby="curated-looks-title">
            {/* Header */}
            <div className="mx-auto mb-8 flex max-w-[1200px] items-end justify-between px-4 sm:mb-10 sm:px-8 lg:px-0">
                <div>
                    <p className="boutique-eyebrow mb-2">
                        Dress by feeling
                    </p>
                    <h2 id="curated-looks-title" className="boutique-heading text-3xl text-stone-900 sm:text-4xl">
                        A point of view for every mood.
                    </h2>
                    <p className="mt-2 text-sm text-stone-500">
                        Follow the edit that feels closest to your own style.
                    </p>
                </div>

                <div className="hidden items-center gap-4 sm:flex">
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-1.5 border-b border-[#5433eb] pb-1 text-sm font-medium text-neutral-900 transition-colors hover:text-[#5433eb]"
                    >
                        Explore all <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                    <div className="flex gap-2">
                    <button
                        onClick={() => scroll(-1)}
                        disabled={!navigation.canGoBack}
                        aria-label="Previous looks"
                        aria-controls="curated-looks-rail"
                        className={controlClass}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        disabled={!navigation.canGoForward}
                        aria-label="Next looks"
                        aria-controls="curated-looks-rail"
                        className={controlClass}
                    >
                        <ChevronRight size={18} />
                    </button>
                    </div>
                </div>
            </div>

            {/* Editorial carousel */}
            <div
                id="curated-looks-rail"
                ref={sliderRef}
                role="region"
                aria-label="Curated style collections"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={() => {
                    pointerStartRef.current = null;
                }}
                onPointerCancel={() => {
                    pointerStartRef.current = null;
                }}
                className="editorial-rail mx-auto flex max-w-[1200px] snap-x snap-mandatory items-center gap-4 overflow-x-auto overscroll-x-contain px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-8 lg:gap-6 lg:px-0"
            >
                {looks.map((look) => (
                        <Link
                            to={look.link}
                            key={look.title}
                            onClick={preventDragClick}
                            className="group block w-[72vw] shrink-0 snap-start rounded-[28px] bg-white p-1.5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.08),0_2px_4px_-2px_rgba(0,0,0,0.08)] transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] sm:w-[38vw] lg:w-[calc((100%_-_48px)_/_3.25)] xl:w-[calc((100%_-_72px)_/_4.35)]"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-neutral-100">
                                <img
                                    src={look.image}
                                    alt={look.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />

                                <span className="absolute left-3 top-3 rounded-xl bg-white/90 px-2.5 py-1 text-[9px] font-medium tracking-[0.1em] text-stone-800 backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[10px]">
                                    {look.category}
                                </span>

                                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 sm:inset-x-4 sm:bottom-4">
                                    <div className="text-white">
                                        <h3 className="text-base font-medium tracking-tight sm:text-xl">
                                            {look.title}
                                        </h3>
                                        <p className="mt-1 text-[10px] text-white/80 sm:text-xs">
                                            Discover the collection
                                        </p>
                                    </div>

                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-stone-900 transition-colors duration-200 group-hover:bg-[#5433eb] group-hover:text-white">
                                        <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                ))}
            </div>

            {/* Mobile discoverability action */}
            <div className="mt-5 flex items-center justify-center gap-3 px-5 sm:hidden">
                <span className="h-px w-8 bg-stone-300" />
                <Link
                    to="/shop"
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-700 transition hover:text-[#5433eb] sm:text-xs"
                >
                    Explore all collections
                </Link>
                <span className="h-px w-8 bg-stone-300" />
            </div>

            {/* Mobile navigation */}
            <div className="mt-5 flex justify-center gap-3 sm:hidden">
                <button
                    onClick={() => scroll(-1)}
                    disabled={!navigation.canGoBack}
                    aria-label="Previous looks"
                    aria-controls="curated-looks-rail"
                    className={controlClass}
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => scroll(1)}
                    disabled={!navigation.canGoForward}
                    aria-label="Next looks"
                    aria-controls="curated-looks-rail"
                    className={controlClass}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </section>
    );
}
