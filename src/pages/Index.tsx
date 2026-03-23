import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, TrendingUp, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-secondary/90">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="container relative py-16 md:py-20">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-foreground/10 text-secondary-foreground/90 text-xs font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Marketplace de Saúde e Bem-Estar
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-secondary-foreground mb-4 leading-[1.15] text-balance">
              Saúde e Bem-Estar{" "}
              <span className="text-primary">ao seu Alcance</span>
            </h1>
            <p className="text-secondary-foreground/70 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
              Produtos verificados de fornecedores confiáveis. Alimentação saudável, suplementos, equipamento médico e muito mais.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 bg-card text-card-foreground border-0 rounded-xl shadow-lg shadow-foreground/5 text-sm placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
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
