import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, TrendingUp, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import PartnerBanner from "@/components/PartnerBanner";
import { useStore } from "@/contexts/StoreContext";
import type { Category } from "@/types/store";
import { Link } from "react-router-dom";

const HERO_SLIDES = [
  {
    id: 1,
    title: "Saúde e Bem-Estar",
    highlight: "ao seu Alcance",
    subtitle: "Produtos verificados de fornecedores confiáveis. Alimentação saudável, suplementos e muito mais.",
    bg: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1400&h=600&fit=crop",
    badge: "Marketplace de Saúde",
  },
  {
    id: 2,
    title: "Suplementos Premium",
    highlight: "para o seu Treino",
    subtitle: "Proteínas, vitaminas e minerais dos melhores fornecedores de Moçambique.",
    bg: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400&h=600&fit=crop",
    badge: "Parceiro: NutriVida",
  },
  {
    id: 3,
    title: "Equipamento Médico",
    highlight: "Certificado e Acessível",
    subtitle: "Kits de primeiros socorros, oxímetros e balanças inteligentes com entrega rápida.",
    bg: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1400&h=600&fit=crop",
    badge: "Parceiro: MedSupply",
  },
  {
    id: 4,
    title: "Alimentação Orgânica",
    highlight: "Directo do Campo",
    subtitle: "Granola, mel puro, sementes de chia e outros produtos naturais sem aditivos.",
    bg: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1400&h=600&fit=crop",
    badge: "Parceiro: Orgânico do Campo",
  },
];

const Index = () => {
  const { products } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => setCurrentSlide((s) => (s + 1) % HERO_SLIDES.length), []);
  const prevSlide = useCallback(() => setCurrentSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);
  const goToSlide = useCallback((i: number) => setCurrentSlide(i), []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Hero Carousel */}
      <section className="relative overflow-hidden h-[340px] md:h-[420px]">
        {/* Slides */}
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-all duration-700 ease-in-out"
            style={{
              opacity: currentSlide === i ? 1 : 0,
              transform: currentSlide === i ? "scale(1)" : "scale(1.05)",
            }}
          >
            {/* Background image */}
            <img
              src={slide.bg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="container relative h-full flex items-center z-10">
          <div className="max-w-xl">
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={slide.id}
                className="transition-all duration-500"
                style={{
                  opacity: currentSlide === i ? 1 : 0,
                  transform: currentSlide === i ? "translateY(0)" : "translateY(20px)",
                  position: currentSlide === i ? "relative" : "absolute",
                  pointerEvents: currentSlide === i ? "auto" : "none",
                }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {slide.badge}
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-3 leading-[1.15] text-balance">
                  {slide.title}{" "}
                  <span className="text-primary">{slide.highlight}</span>
                </h1>
                <p className="text-white/70 text-sm md:text-base mb-6 max-w-lg leading-relaxed">
                  {slide.subtitle}
                </p>
              </div>
            ))}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 bg-card/95 backdrop-blur-sm text-card-foreground border-0 rounded-xl shadow-lg shadow-foreground/5 text-sm placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === i
                  ? "w-6 bg-primary"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      <main className="container flex-1 py-10">
        {/* Featured */}
        {!search && !selectedCategory && featuredProducts.length > 0 && (
          <section className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold">Destaques</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {featuredProducts.slice(0, 4).map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories & Products */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display font-bold">
              {selectedCategory ? "Categoria" : "Todos os Produtos"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}
            </span>
          </div>
          
          <div className="mb-6">
            <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-display font-semibold mb-1">Nenhum produto encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou a pesquisa</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filteredProducts.map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <StoreFooter />
    </div>
  );
};

export default Index;
