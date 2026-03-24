import { useState, useMemo } from "react";
import { Apple, Pill, Cross, GraduationCap, Dumbbell, Armchair, Leaf, Stethoscope, ArrowRight } from "lucide-react";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import PartnerBanner from "@/components/PartnerBanner";
import { useStore } from "@/contexts/StoreContext";
import { CATEGORY_LABELS, type Category } from "@/types/store";

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  "alimentacao-saudavel": <Apple className="w-6 h-6" />,
  "suplementos": <Pill className="w-6 h-6" />,
  "primeiros-socorros": <Cross className="w-6 h-6" />,
  "equipamento-estudante": <GraduationCap className="w-6 h-6" />,
  "fitness-recuperacao": <Dumbbell className="w-6 h-6" />,
  "ergonomia": <Armchair className="w-6 h-6" />,
  "nutricao": <Leaf className="w-6 h-6" />,
  "diagnostico": <Stethoscope className="w-6 h-6" />,
};

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  "alimentacao-saudavel": "Produtos naturais, granola, mel e alimentos sem aditivos para uma vida mais saudável.",
  "suplementos": "Proteínas, vitaminas e minerais para suportar a sua saúde e performance.",
  "primeiros-socorros": "Kits completos, pensos, compressas e material de emergência certificado.",
  "equipamento-estudante": "Mochilas ergonómicas, material de estudo e acessórios para estudantes.",
  "fitness-recuperacao": "Tapetes, bandas de resistência e equipamento para treino e recuperação.",
  "ergonomia": "Suportes lombares, almofadas e acessórios para conforto no trabalho e estudo.",
  "nutricao": "Sementes, superalimentos e suplementos nutricionais de origem natural.",
  "diagnostico": "Oxímetros, balanças inteligentes e ferramentas de monitorização da saúde.",
};

const CategoriesPage = () => {
  const { products } = useStore();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const categoryEntries = Object.entries(CATEGORY_LABELS) as [Category, string][];

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground py-14 md:py-20">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-3">Categorias</h1>
          <p className="text-secondary-foreground/70 max-w-lg mx-auto">
            Explore todas as categorias de produtos disponíveis no nosso marketplace de saúde e bem-estar.
          </p>
        </div>
      </section>

      <main className="container flex-1 py-10">
        <PartnerBanner variant="wide" className="mb-10" />

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {categoryEntries.map(([key, label]) => {
            const count = products.filter((p) => p.category === key).length;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(isActive ? null : key)}
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card border-border hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                }`}>
                  {CATEGORY_ICONS[key]}
                </div>
                <h3 className="font-display font-bold text-sm mb-1">{label}</h3>
                <p className={`text-xs mb-2 line-clamp-2 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {CATEGORY_DESCRIPTIONS[key]}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isActive ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {count} {count === 1 ? "produto" : "produtos"}
                  </span>
                  <ArrowRight className={`w-4 h-4 transition-transform ${isActive ? "" : "group-hover:translate-x-1"}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Products for selected category */}
        {activeCategory && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold">{CATEGORY_LABELS[activeCategory]}</h2>
              <span className="text-sm text-muted-foreground">{filteredProducts.length} produtos</span>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="font-display font-semibold">Nenhum produto nesta categoria</p>
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
        )}

        {!activeCategory && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-display font-semibold text-lg mb-1">Seleccione uma categoria</p>
            <p className="text-sm">Clique numa categoria acima para ver os produtos disponíveis</p>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
};

export default CategoriesPage;
