import { Link, useNavigate } from "react-router-dom";
import { Star, BadgeCheck, ShoppingBag, Package, Crown, ArrowLeft, TrendingUp, Megaphone, Eye, Percent, BarChart3, Users, Rocket, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useStore } from "@/contexts/StoreContext";
import { CATEGORY_LABELS } from "@/types/store";

const PartnersPage = () => {
  const { suppliers, products, orders, premiumSettings } = useStore();
  const navigate = useNavigate();

  const getSupplierStats = (supplierId: string) => {
    const supplierProducts = products.filter((p) => p.supplierId === supplierId);
    const categories = [...new Set(supplierProducts.map((p) => p.category))];
    const totalSales = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.items.filter((i) => i.product.supplierId === supplierId).reduce((s, i) => s + i.quantity, 0), 0);
    return { productCount: supplierProducts.length, categories, totalSales };
  };

  const benefits = [
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Selo Premium",
      desc: "Selo de recomendação especial DrOnline visível em todos os seus produtos e perfil de parceiro.",
      color: "text-amber-600 bg-amber-500/10",
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Destaque Prioritário",
      desc: "Os seus produtos aparecem em posições privilegiadas no catálogo e nas pesquisas dos consumidores.",
      color: "text-primary bg-primary/10",
    },
    {
      icon: <Megaphone className="w-6 h-6" />,
      title: `${premiumSettings.prioritySlots} Slides Publicitários`,
      desc: "Inserção preferencial em espaços publicitários do marketplace, incluindo o carrossel principal.",
      color: "text-blue-600 bg-blue-500/10",
    },
    {
      icon: <Percent className="w-6 h-6" />,
      title: `${Math.round(premiumSettings.adDiscount * 100)}% Desconto em Ads`,
      desc: "Desconto exclusivo nas taxas de campanhas publicitárias dentro da plataforma DrOnline.",
      color: "text-emerald-600 bg-emerald-500/10",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Relatórios Dedicados",
      desc: "Acesso a relatórios de vendas e desempenho dos seus produtos filtrados por período.",
      color: "text-violet-600 bg-violet-500/10",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verificação & Confiança",
      desc: "Selo de fornecedor verificado que transmite segurança e credibilidade aos consumidores.",
      color: "text-teal-600 bg-teal-500/10",
    },
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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {b.icon}
                  </div>
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
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${b.color}`}>
                    {b.icon}
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Partners listing */}
        <section className="bg-muted/30 border-t border-border">
          <div className="container py-14">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-display font-bold mb-2">Nossos Parceiros</h2>
              <p className="text-muted-foreground text-sm">
                Conheça os fornecedores verificados e explore os seus produtos
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => {
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
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-lg overflow-hidden ${
                          isPremium ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                        }`}>
                          {supplier.logo ? <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" /> : supplier.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display font-bold text-base truncate">{supplier.name}</h3>
                            {supplier.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold">{supplier.rating}</span>
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

                      {/* CTA hint */}
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
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
};

export default PartnersPage;
