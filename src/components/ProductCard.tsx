import { Link } from "react-router-dom";
import { ShoppingCart, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import type { Product } from "@/types/store";
import { toast } from "sonner";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { getSupplier } = useStore();
  const supplier = getSupplier(product.supplierId);
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error(`${product.name} está esgotado`);
      return;
    }
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);
  };

  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/produto/${product.id}`} className="group block h-full">
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-foreground/[0.04] hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground/40 text-xs font-medium">Sem imagem</span>
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          {discountPct > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              -{discountPct}%
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
              <span className="bg-foreground/80 text-card text-xs font-bold px-3 py-1 rounded-md">Esgotado</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-1">
          {supplier && (
            <div className="flex items-center gap-1.5 mb-1.5">
              {supplier.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              <span className="text-[11px] text-muted-foreground truncate leading-none">{supplier.name}</span>
            </div>
          )}

          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 mb-auto text-foreground group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>

          <div className="flex items-end justify-between pt-3 mt-2 border-t border-border/40">
            <div className="flex flex-col">
              {product.originalPrice && (
                <span className="text-[11px] text-muted-foreground line-through leading-none mb-0.5">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              <span className="font-display font-bold text-base leading-none text-foreground">
                {formatPrice(product.price)}
              </span>
            </div>
            <Button
              size="icon"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-40"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
