import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, TrendingUp, Sparkles, ChevronLeft, ChevronRight, Shield, Truck, CreditCard, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import PartnerBanner from "@/components/PartnerBanner";
import { useStore } from "@/contexts/StoreContext";
import type { Category } from "@/types/store";
import { Link, useSearchParams } from "react-router-dom";

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

const TRUST_ITEMS = [
  { icon: <Shield className="w-5 h-5" />, title: "Produtos Verificados", desc: "Fornecedores certificados" },
  { icon: <Truck className="w-5 h-5" />, title: "Entrega Nacional", desc: "Em todo Moçambique" },
  { icon: <CreditCard className="w-5 h-5" />, title: "Pagamento Seguro", desc: "M-Pesa & Transferência" },
];

const Index = () => {
  const { products, adCampaigns, suppliers } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const supplierFilter = searchParams.get("fornecedor");
  const activeSupplier = supplierFilter ? suppliers.find((s) => s.id === supplierFilter) : null;

  const clearSupplierFilter = () => {
    searchParams.delete("fornecedor");
    setSearchParams(searchParams);
  };

  const nextSlide = useCallback(() => setCurrentSlide((s) => (s + 1) % HERO_SLIDES.length), []);
  const prevSlide = useCallback(() => setCurrentSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);
  const goToSlide = useCallback((i: number) => setCurrentSlide(i), []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const featuredProductIds = useMemo(() => {
    return adCampaigns
      .filter((a) => a.space === "featured" && a.status === "active")
      .map((a) => a.url)
      .filter(Boolean);
  }, [adCampaigns]);

  const featuredProducts = useMemo(() => {
    if (featuredProductIds.length > 0) {
      return products.filter((p) => featuredProductIds.includes(p.id));
    }
    return products.filter((p) => p.featured);
  }, [products, featuredProductIds]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesSupplier = !supplierFilter || p.supplierId === supplierFilter;
      return matchesCat && matchesSearch && matchesSupplier;
    });
  }, [products, selectedCategory, search, supplierFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Hero Carousel */}
      <section className="relative overflow-hidden h-[360px] md:h-[440px]">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-all duration-700 ease-in-out"
            style={{
              opacity: currentSlide === i ? 1 : 0,
              transform: currentSlide === i ? "scale(1)" : "scale(1.05)",
            }}
          >
            <img src={slide.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/55 to-secondary/10" />
          </div>
        ))}

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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium mb-4 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  {slide.badge}
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-3 leading-[1.15] text-balance">
                  {slide.title}{" "}
                  <span className="text-primary-foreground/80 drop-shadow-sm">{slide.highlight}</span>
                </h1>
                <p className="text-white/65 text-sm md:text-base mb-6 max-w-lg leading-relaxed">
                  {slide.subtitle}
                </p>
              </div>
            ))}

            {/* Search bar - DrOnline "ENCONTRE" style */}
            <div className="max-w-md">
              <div className="bg-primary rounded-xl p-1 shadow-lg shadow-primary/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    placeholder="Pesquisar produtos, categorias..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-card text-card-foreground border-0 rounded-lg text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 border border-white/10"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 border border-white/10"
          aria-label="Próximo slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === i
                  ? "w-7 bg-white"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {TRUST_ITEMS.map((item, idx) => (
              <div key={item.title} className={`flex items-center gap-3 py-1 ${idx > 0 ? "sm:border-l sm:border-border sm:pl-6" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-display font-semibold leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="container flex-1 py-8 md:py-10">
        {/* Partner Ad Banner */}
        <PartnerBanner variant="wide" className="mb-8" />

        {/* Featured */}
        {!search && !selectedCategory && featuredProducts.length > 0 && (
          <section className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-display font-bold leading-tight">Destaques</h2>
                  <p className="text-xs text-muted-foreground">Produtos em destaque no marketplace</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {featuredProducts.slice(0, 4).map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-5 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
              Explorar Catálogo
            </span>
          </div>
        </div>

        {/* Supplier filter banner */}
        {activeSupplier && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-primary overflow-hidden flex-shrink-0">
              {activeSupplier.logo ? <img src={activeSupplier.logo} alt={activeSupplier.name} className="w-full h-full object-cover" /> : activeSupplier.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold truncate">Produtos de {activeSupplier.name}</p>
              <p className="text-xs text-muted-foreground">{filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"} disponíveis</p>
            </div>
            <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={clearSupplierFilter}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Categories & Products */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-display font-bold">
              {activeSupplier ? `Produtos de ${activeSupplier.name}` : selectedCategory ? "Categoria" : "Todos os Produtos"}
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}
            </span>
          </div>

          <div className="mb-6">
            <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-base font-display font-semibold mb-1">Nenhum produto encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou a pesquisa</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
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
