"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudSun,
  CloudRainWind,
  CloudSnowIcon as CloudSnowAlt,
  MapPin,
  Search,
  ArrowRight,
  Compass,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Briefcase,
  Camera,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  Eye,
  Navigation,
  ExternalLink,
  AlertCircle,
  X,
  Star,
} from "lucide-react";

interface CityInfo {
  city: string;
  country: string;
  population: string | number;
  latitude: number;
  longitude: number;
}

interface WeatherData {
  temperature: string;
  feelsLike: string;
  humidity: string;
  windSpeed: string;
  windDirection: string;
  condition: string;
  icon: string;
}

interface WikiContent {
  title: string;
  intro: string;
  wikiUrl: string;
}

interface CityImage {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
  width: number;
  height: number;
}

interface WorkflowResult {
  step: string;
  content: string;
}

const weatherIcons: Record<string, React.ElementType> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRainWind,
  "cloud-snow": CloudSnow,
  "cloud-snow-alt": CloudSnowAlt,
  "cloud-lightning": CloudLightning,
  cloud: Cloud,
};

function useOnScreen(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return isVisible;
}

function AnimatedCard({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

function Background() {
  return <div className="fixed inset-0 -z-10 bg-background" />;
}

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="glass-card rounded-2xl p-4 flex items-start gap-3" role="alert">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/90 flex-1">{message}</p>
        <button 
          onClick={onDismiss} 
          className="p-1 hover:bg-white/10 rounded-lg"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4 text-foreground/50" />
        </button>
      </div>
    </div>
  );
}

function ImageCarousel({ images, cityName }: { images: CityImage[]; cityName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % images.length), 5000);
    return () => clearInterval(interval);
  }, [isPaused, images.length]);

  const goTo = (index: number) => setCurrentIndex(index);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) { goNext(); } else { goPrev(); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  if (!images.length) return null;

  return (
    <AnimatedCard delay={0} className="relative mb-8 sm:mb-12 group">
      <div 
        className="relative aspect-[16/10] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden glass-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0">
          <Image 
            src={images[currentIndex].url} 
            alt={images[currentIndex].alt} 
            fill 
            className="object-cover transition-opacity duration-500" 
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px" 
            priority={currentIndex === 0} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <div className="flex items-center gap-2 text-xs sm:text-sm opacity-80">
            <Camera className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
            <span>
              Photo by{" "}
              <a href={images[currentIndex].photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">{images[currentIndex].photographer}</a>
              {" "}on{" "}
              <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Pexels</a>
            </span>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button 
              onClick={goPrev} 
              onKeyDown={(e) => handleKeyDown(e, goPrev)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900/60 focus:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <button 
              onClick={goNext}
              onKeyDown={(e) => handleKeyDown(e, goNext)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900/60 focus:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  onKeyDown={(e) => handleKeyDown(e, () => goTo(index))}
                  className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "bg-white w-4" : "bg-white/50 w-1.5 hover:bg-white/70"}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/40 text-white text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
          {cityName}
        </div>
      </div>
    </AnimatedCard>
  );
}

function WeatherCard({ weather, cityInfo }: { weather: WeatherData; cityInfo: CityInfo }) {
  const WeatherIcon = weatherIcons[weather.icon] || Cloud;

  return (
    <AnimatedCard delay={50} className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 card-hover">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-foreground/60 mb-1 text-sm">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="truncate">{cityInfo.city}, {cityInfo.country}</span>
          </div>
          <div className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-foreground/90 leading-none text-pretty">
            {weather.temperature}
          </div>
          <div className="text-sm sm:text-base text-foreground/60 mt-1.5">
            Feels like {weather.feelsLike}
          </div>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-sky-500 flex items-center justify-center flex-shrink-0">
          <WeatherIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>

      <div className="text-xl sm:text-2xl font-semibold text-foreground/90 mb-4 sm:mb-6 text-pretty">
        {weather.condition}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <WeatherMetric icon={Droplets} label="Humidity" value={weather.humidity} />
        <WeatherMetric icon={Wind} label="Wind" value={weather.windSpeed} />
        <WeatherMetric icon={Navigation} label="Direction" value={weather.windDirection} />
        <WeatherMetric icon={Eye} label="Visibility" value="10 km" />
      </div>
    </AnimatedCard>
  );
}

function WeatherMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/15 dark:bg-white/5">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-foreground/50 uppercase tracking-wider whitespace-nowrap">{label}</p>
        <p className="text-xs sm:text-sm font-semibold text-foreground/90 truncate tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function CityOverviewCard({ wiki }: { wiki: WikiContent }) {
  return (
    <AnimatedCard delay={100} className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 card-hover">
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground/90 truncate text-balance">{wiki.title}</h2>
      </div>
      <div className="h-px bg-foreground/10 mb-4" />
      <p className="text-foreground/70 leading-relaxed text-sm sm:text-base mb-4 text-pretty line-clamp-3 sm:line-clamp-none">{wiki.intro}</p>
      {wiki.wikiUrl && (
        <a href={wiki.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-sky-500 hover:text-sky-400 transition-colors">
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          Read more on Wikipedia
        </a>
      )}
    </AnimatedCard>
  );
}

function InsightsCard({ content }: { content: string }) {
  const sections = content.split(/(?=## )/).filter(s => s.trim());

  const iconMap: Record<string, React.ElementType> = {
    "History & Foundation": Building2,
    "Famous Landmarks": Camera,
    "Local Culture & Cuisine": UtensilsCrossed,
    "For Business Travelers": Briefcase,
    "For Vacationers": MapPin,
    "City Highlights & Famous Faces": Star,
  };

  return (
    <AnimatedCard delay={150} className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground/90 text-balance">City Insights</h2>
      </div>

      <div className="grid gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const lines = section.trim().split("\n");
          const title = lines[0].replace(/^##\s*/, "").replace(/\*\*/g, "");
          const body = lines.slice(1).join("\n").trim().replace(/\*\*/g, "").replace(/\*/g, "").replace(/^[-•]\s*/gm, "");

          const Icon = iconMap[title] || Sparkles;
          
          return (
            <div
              key={title}
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-sky-500/10 card-hover"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-foreground/70 flex-shrink-0" aria-hidden="true" />
                <h3 className="font-medium sm:font-semibold text-foreground/90 text-sm sm:text-base text-balance">{title}</h3>
              </div>
              <p className="text-foreground/70 leading-relaxed text-xs sm:text-sm text-justify line-clamp-4 sm:line-clamp-none">{body}</p>
            </div>
          );
        })}
      </div>
    </AnimatedCard>
  );
}

function CityInfoHeader({ cityInfo }: { cityInfo: CityInfo }) {
  return (
    <AnimatedCard delay={0} className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card text-sm">
        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" aria-hidden="true" />
        <span className="text-foreground/70">{cityInfo.city}, {cityInfo.country}</span>
      </div>
      {cityInfo.population && cityInfo.population !== "Unknown" && (
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card text-sm">
          <span className="text-foreground/70 tabular-nums">~{typeof cityInfo.population === "number" ? cityInfo.population.toLocaleString() : cityInfo.population}</span>
        </div>
      )}
    </AnimatedCard>
  );
}

function LoadingState({ cityName }: { cityName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-sky-500/30 border-t-sky-500 animate-spin mb-4" />
      <p className="text-foreground/60 text-base sm:text-lg">Discovering {cityName}…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 sm:py-20">
      <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-sky-500/10 mb-6 animate-pulse-subtle">
        <Cloud className="w-10 h-10 sm:w-12 sm:h-12 text-sky-500/50" />
      </div>
      <p className="text-foreground/50 text-base sm:text-lg">Enter a city name to discover its atmosphere</p>
    </div>
  );
}

export default function Home() {
  const [city, setCity] = useState("");
  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: city }),
      });
      const data = await response.json();
      if (data.error) { setError(data.error); return; }
      setResults(data.results || []);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch city information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cityInfo: CityInfo | null = results.find((r) => r.step === "1") ? JSON.parse(results.find((r) => r.step === "1")!.content) : null;
  const weatherData: WeatherData | null = results.find((r) => r.step === "2") ? JSON.parse(results.find((r) => r.step === "2")!.content) : null;
  const wikiContent: WikiContent | null = results.find((r) => r.step === "3") ? JSON.parse(results.find((r) => r.step === "3")!.content) : null;
  const insights = results.find((r) => r.step === "4")?.content || "";
  const cityImages: CityImage[] = results.find((r) => r.step === "5") ? JSON.parse(results.find((r) => r.step === "5")!.content) : [];

  if (!mounted) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background overflow-y-auto">
      <Background />

      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="text-center mb-8 sm:mb-12">
          <AnimatedCard delay={0}>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/25 dark:bg-white/10 backdrop-blur-sm mb-4 sm:mb-6">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" aria-hidden="true" />
              <span className="text-xs sm:text-sm text-foreground/70">Discover cities worldwide</span>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={50}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-3 sm:mb-4 tracking-tight px-4 text-balance">
              <span className="text-sky-500">City Weather</span>
              <br />
              <span className="text-foreground/90">& Explorer</span>
            </h1>
          </AnimatedCard>

          <AnimatedCard delay={100}>
            <p className="text-base sm:text-lg text-foreground/60 max-w-lg mx-auto px-4 text-pretty">
              Get comprehensive city information including weather, landmarks, and travel insights.
            </p>
          </AnimatedCard>

          <button 
            onClick={toggleTheme} 
            className="absolute top-6 right-4 sm:top-8 sm:right-6 p-2.5 sm:p-3 rounded-full glass-card hover:shadow-md transition-all btn-hover"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            )}
          </button>
        </header>

        <AnimatedCard delay={150} className="mb-8 sm:mb-12 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 sm:left-5 pointer-events-none">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/40" aria-hidden="true" />
              </div>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                placeholder="Where are you exploring?" 
                autoComplete="off"
                name="city-search"
                className="w-full pl-12 sm:pl-14 pr-28 sm:pr-36 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl glass-card text-base sm:text-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-sky-500 input-focus bg-white/40 dark:bg-white/5"
                required 
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="absolute right-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-sky-500 text-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base btn-hover"
              >
                {loading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5 sm:gap-2">Explore <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
                )}
              </button>
            </div>
          </form>
        </AnimatedCard>

        {loading && <LoadingState cityName={city} />}

        {!loading && results.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {cityImages.length > 0 && cityInfo && <ImageCarousel images={cityImages} cityName={cityInfo.city} />}
            {cityInfo && <CityInfoHeader cityInfo={cityInfo} />}

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {weatherData && cityInfo && (
                <div className="lg:row-span-2">
                  <WeatherCard weather={weatherData} cityInfo={cityInfo} />
                </div>
              )}
              {wikiContent && (
                <div>
                  <CityOverviewCard wiki={wikiContent} />
                </div>
              )}
            </div>

            {insights && <InsightsCard content={insights} />}

            <AnimatedCard delay={300} className="text-center pt-8 pb-4">
              <p className="text-xs sm:text-sm text-foreground/40">Powered by Open-Meteo, Wikipedia & Pexels</p>
            </AnimatedCard>
          </div>
        )}

        {!loading && results.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}