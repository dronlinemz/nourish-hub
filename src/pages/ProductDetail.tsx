import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, BadgeCheck, Star, Package, Shield, Truck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
import PartnerBanner from "@/components/PartnerBanner";
import { useStore } from "@/contexts/StoreContext";
import { useCart } from "@/contexts/CartContext";
import { CATEGORY_LABELS } from "@/types/store";
import { useState } from "react";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const { products, getSupplier } = useStore();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-display font-semibold mb-2">Produto não encontrado</p>
            <p className="text-sm text-muted-foreground mb-4">O produto que procura não existe ou foi removido</p>
            <Link to="/"><Button className="bg-primary text-primary-foreground">Voltar à loja</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const supplier = getSupplier(product.supplierId);
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAdd = () => {
    if (product.stock <= 0) {
      toast.error("Produto esgotado");
      return;
    }
    if (qty > product.stock) {
      toast.error(`Apenas ${product.stock} unidades disponíveis`);
      return;
    }
    addItem(product, qty);
    toast.success(`${qty}x ${product.name} adicionado ao carrinho`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Loja</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-muted-foreground/70">{CATEGORY_LABELS[product.category]}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <main className="container flex-1 py-8 md:py-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Image */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {discount && (
                <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-lg">
                  -{discount}%
                </span>
              )}
            </div>
            {/* Trust badges under image */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Produto verificado</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Entrega nacional</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit mb-3">
              {CATEGORY_LABELS[product.category]}
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-3 leading-tight">{product.name}</h1>

            {/* Price block */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-display font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-base text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? "bg-primary" : product.stock > 0 ? "bg-accent" : "bg-destructive"}`} />
              <span className="text-sm text-muted-foreground">
                {product.stock > 10 ? "Em stock" : product.stock > 0 ? `Apenas ${product.stock} restantes` : "Esgotado"}
              </span>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  −
                </button>
                <span className="px-5 py-3 text-sm font-semibold border-x border-border min-w-[3rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAdd}
                disabled={product.stock === 0}
                className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>

            {/* Supplier Card */}
            {supplier && (
              <Card className="p-5 border-border bg-card rounded-xl">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Fornecedor</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-display font-bold text-sm">{supplier.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-sm">{supplier.name}</span>
                      {supplier.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <BadgeCheck className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                      <span className="text-xs font-semibold">{supplier.rating}</span>
                      <span className="text-xs text-muted-foreground">/5.0</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{supplier.description}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Partner Ad */}
        <PartnerBanner variant="wide" className="mt-12" />

        {/* Related */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm font-display font-semibold text-muted-foreground">
                  Produtos Relacionados
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <StoreFooter />
    </div>
  );
};

export default ProductDetail;
