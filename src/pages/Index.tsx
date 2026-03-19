import { useState, useMemo } from "react";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useStore } from "@/contexts/StoreContext";
import type { Category } from "@/types/store";

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
    <div className="min-h-screen flex flex-col">
      <StoreHeader />

      {/* Hero */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Saúde e Bem-Estar ao seu Alcance
            </h1>
            <p className="text-secondary-foreground/80 text-lg mb-6">
              Produtos verificados de fornecedores confiáveis. Alimentação saudável, suplementos, equipamento médico e muito mais.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card text-card-foreground border-0"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-8">
        {/* Featured */}
        {!search && !selectedCategory && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-display font-bold">Destaques</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-6">
          <h2 className="text-xl font-display font-bold mb-4">
            {selectedCategory ? "Categoria" : "Todos os Produtos"}
          </h2>
          <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
        </section>

        {/* Products Grid */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou a pesquisa</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
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
