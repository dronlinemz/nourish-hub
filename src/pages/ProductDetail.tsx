import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, BadgeCheck, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import ProductCard from "@/components/ProductCard";
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
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Produto não encontrado</p>
            <Link to="/"><Button variant="outline" className="mt-4">Voltar à loja</Button></Link>
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

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${qty}x ${product.name} adicionado ao carrinho`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="container flex-1 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar à loja
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div>
            <span className="badge-category text-xs mb-2 inline-block">
              {CATEGORY_LABELS[product.category]}
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{product.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-display font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <p className="text-muted-foreground mb-6">{product.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {product.stock > 0 ? `${product.stock} em stock` : "Esgotado"}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm font-medium border-x">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAdd} disabled={product.stock === 0} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Supplier Card */}
            {supplier && (
              <Card className="p-4">
                <h3 className="font-display font-semibold text-sm mb-2 text-muted-foreground">Fornecedor</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display font-bold">{supplier.name}</span>
                  {supplier.verified && (
                    <span className="badge-verified">
                      <BadgeCheck className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-sm font-medium">{supplier.rating}</span>
                </div>
                <p className="text-sm text-muted-foreground">{supplier.description}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-display font-bold mb-4">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
