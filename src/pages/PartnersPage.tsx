import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, BadgeCheck, ShoppingBag, Package, Crown, ArrowLeft, TrendingUp, Megaphone, Eye, Percent, BarChart3, Users, Rocket, Shield, Search, MapPin, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useStore } from "@/contexts/StoreContext";
import { CATEGORY_LABELS, type Category } from "@/types/store";

const PartnersPage = () => {
  const { suppliers, products, orders, premiumSettings } = useStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");

  const getSupplierStats = (supplierId: string) => {
    const supplierProducts = products.filter((p) => p.supplierId === supplierId);
    const categories = [...new Set(supplierProducts.map((p) => p.category))];
    const totalSales = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.items.filter((i) => i.product.supplierId === supplierId).reduce((s, i) => s + i.quantity, 0), 0);
    return { productCount: supplierProducts.length, categories, totalSales };
  };

  // Derive unique locations and categories from suppliers
  const allLocations = useMemo(() => {
    const locs = [...new Set(suppliers.map((s) => s.location).filter(Boolean))];
    return locs.sort();
  }, [suppliers]);

  const allSupplierCategories = useMemo(() => {
    const cats = new Set<Category>();
    suppliers.forEach((s) => {
      products.filter((p) => p.supplierId === s.id).forEach((p) => cats.add(p.category));
    });
    return [...cats].sort();
  }, [suppliers, products]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = !selectedLocation || s.location === selectedLocation;
      const matchesCategory = !selectedCategory || products.some((p) => p.supplierId === s.id && p.category === selectedCategory);
      return matchesSearch && matchesLocation && matchesCategory;
    });
  }, [suppliers, products, searchQuery, selectedLocation, selectedCategory]);

  const hasFilters = searchQuery || selectedLocation || selectedCategory;

  const benefits = [
    { icon: <Crown className="w-6 h-6" />, title: "Selo Premium", desc: "Selo de recomendação especial DrOnline visível em todos os seus produtos e perfil de parceiro.", color: "text-amber-600 bg-amber-500/10" },
    { icon: <Eye className="w-6 h-6" />, title: "Destaque Prioritário", desc: "Os seus produtos aparecem em posições privilegiadas no catálogo e nas pesquisas dos consumidores.", color: "text-primary bg-primary/10" },
    { icon: <Megaphone className="w-6 h-6" />, title: `${premiumSettings.prioritySlots} Slides Publicitários`, desc: "Inserção preferencial em espaços publicitários do marketplace, incluindo o carrossel principal.", color: "text-blue-600 bg-blue-500/10" },
    { icon: <Percent className="w-6 h-6" />, title: `${Math.round(premiumSettings.adDiscount * 100)}% Desconto em Ads`, desc: "Desconto exclusivo nas taxas de campanhas publicitárias dentro da plataforma DrOnline.", color: "text-emerald-600 bg-emerald-500/10" },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Relatórios Dedicados", desc: "Acesso a relatórios de vendas e desempenho dos seus produtos filtrados por período.", color: "text-violet-600 bg-violet-500/10" },
    { icon: <Shield className="w-6 h-6" />, title: "Verificação & Confiança", desc: "Selo de fornecedor verificado que transmite segurança e credibilidade aos consumidores.", color: "text-teal-600 bg-teal-500/10" },
  ];

  const platformBenefits = [
    { icon: <Users className="w-5 h-5 text-primary" />, title: "Acesso a Consumidores", desc: "Alcance milhares de clientes que procuram produtos de saúde e bem-estar em Moçambique." },
    { icon: <Rocket className="w-5 h-5 text-primary" />, title: "Sem Custos Iniciais", desc: "Registe-se como parceiro sem qualquer custo. Pague apenas quando vender." },
    { icon: <TrendingUp className="w-5 h-5 text-primary" />, title: "Crescimento Contínuo", desc: "Ferramentas de publicidade e destaque para impulsionar as suas vendas na plataforma." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 text-secondary-foreground py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="container relative">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar à loja
          </Link>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Crown className="w-3.5 h-3.5" /> Programa de Parceiros
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold mb-4 leading-tight">
              Venda no DrOnline e{" "}
              <span className="text-primary">alcance milhares</span> de clientes
            </h1>
            <p className="text-secondary-foreground/70 text-base md:text-lg leading-relaxed max-w-xl">
              Junte-se ao marketplace de saúde e bem-estar líder em Moçambique.
              Fornecedores verificados, ferramentas de publicidade e um programa Premium exclusivo.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Platform benefits strip */}
        <section className="border-b border-border bg-card">
          <div className="container py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {platformBenefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">{b.icon}</div>
                  <div>
                    <p className="text-sm font-display font-semibold">{b.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Benefits */}
        <section className="container py-14">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold mb-3">
              <Crown className="w-3.5 h-3.5" /> Subscrição de {premiumSettings.subscriptionMonths} meses
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Programa Premium DrOnline</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Eleve a presença da sua marca com benefícios exclusivos que maximizam as suas vendas e visibilidade.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {benefits.map((b) => (
              <Card key={b.title} className="hover:shadow-md transition-shadow border-border/60">
                <CardContent className="p-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${b.color}`}>{b.icon}</div>
                  <h3 className="font-display font-bold text-sm mb-1">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Partners listing with filters */}
        <section className="bg-muted/30 border-t border-border">
          <div className="container py-14">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold mb-2">Nossos Parceiros</h2>
              <p className="text-muted-foreground text-sm">Conheça os fornecedores verificados e explore os seus produtos</p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-3xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar parceiro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Todas as localizações</option>
                  {allLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category | "")}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Todos os segmentos</option>
                  {allSupplierCategories.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filters */}
            {hasFilters && (
              <div className="flex items-center gap-2 mb-6 max-w-3xl mx-auto flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Filtros:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setSearchQuery("")}>
                    "{searchQuery}" <X className="w-3 h-3" />
                  </Badge>
                )}
                {selectedLocation && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setSelectedLocation("")}>
                    <MapPin className="w-3 h-3" /> {selectedLocation} <X className="w-3 h-3" />
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setSelectedCategory("")}>
                    {CATEGORY_LABELS[selectedCategory]} <X className="w-3 h-3" />
                  </Badge>
                )}
                <button onClick={() => { setSearchQuery(""); setSelectedLocation(""); setSelectedCategory(""); }} className="text-xs text-primary hover:underline ml-2">
                  Limpar tudo
                </button>
              </div>
            )}

            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum parceiro encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros de pesquisa</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => {
                  const stats = getSupplierStats(supplier.id);
                  const isPremium = supplier.premium?.active;

                  return (
                    <Card
                      key={supplier.id}
                      className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${isPremium ? "ring-2 ring-amber-500/30" : ""}`}
                      onClick={() => navigate(`/?fornecedor=${supplier.id}`)}
                    >
                      {isPremium && (
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-1.5 flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Parceiro Premium</span>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-lg overflow-hidden ${isPremium ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>
                            {supplier.logo ? <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" /> : supplier.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-display font-bold text-base truncate">{supplier.name}</h3>
                              {supplier.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-semibold">{supplier.rating}</span>
                              </div>
                              {supplier.location && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-xs">{supplier.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{supplier.description}</p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {stats.categories.map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-[10px]">{CATEGORY_LABELS[cat]}</Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-bold">{stats.productCount}</p>
                              <p className="text-[10px] text-muted-foreground">Produtos</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-bold">{stats.totalSales}</p>
                              <p className="text-[10px] text-muted-foreground">Vendas</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border text-center">
                          <span className="text-xs font-semibold text-primary group-hover:underline transition-all">
                            Ver produtos deste parceiro →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
};

export default PartnersPage;
