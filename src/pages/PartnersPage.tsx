import { Link } from "react-router-dom";
import { Star, BadgeCheck, ShoppingBag, Package, Crown, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useStore } from "@/contexts/StoreContext";
import { CATEGORY_LABELS } from "@/types/store";

const PartnersPage = () => {
  const { suppliers, products, orders } = useStore();

  const getSupplierStats = (supplierId: string) => {
    const supplierProducts = products.filter((p) => p.supplierId === supplierId);
    const categories = [...new Set(supplierProducts.map((p) => p.category))];
    const totalSales = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.items.filter((i) => i.product.supplierId === supplierId).reduce((s, i) => s + i.quantity, 0), 0);
    return { productCount: supplierProducts.length, categories, totalSales };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar à loja
          </Link>
          <h1 className="text-3xl font-display font-bold">Nossos Parceiros</h1>
          <p className="text-muted-foreground mt-1">Fornecedores verificados do marketplace DrOnline</p>
        </div>
      </div>

      <main className="container flex-1 py-10">
        {/* Premium info banner */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg mb-1">Programa Premium DrOnline</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Parceiros com o selo <strong className="text-amber-600">Premium</strong> têm uma subscrição que lhes garante
                destaque prioritário no marketplace, inserção preferencial em espaços publicitários com desconto nas taxas,
                e recomendação especial da DrOnline aos consumidores.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => {
            const stats = getSupplierStats(supplier.id);
            const isPremium = supplier.premium?.active;

            return (
              <Card key={supplier.id} className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${isPremium ? "ring-2 ring-amber-500/30" : ""}`}>
                {isPremium && (
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-1.5 flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Parceiro Premium</span>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-lg ${
                      isPremium ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                    }`}>
                      {supplier.name.charAt(0)}
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

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{supplier.description}</p>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {stats.categories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-[10px]">{CATEGORY_LABELS[cat]}</Badge>
                    ))}
                  </div>

                  {/* Stats */}
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

                  {/* Contact */}
                  <div className="mt-4 pt-4 border-t border-border space-y-1">
                    <p className="text-xs text-muted-foreground truncate">{supplier.contactEmail}</p>
                    <p className="text-xs text-muted-foreground">{supplier.contactPhone}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default PartnersPage;
