import { Link } from "react-router-dom";
import { ShoppingCart, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import type { Product } from "@/types/store";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { getSupplier } = useStore();
  const supplier = getSupplier(product.supplierId);

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

  return (
    <Link to={`/produto/${product.id}`} className="group">
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-xl hover:shadow-foreground/5 hover:border-border transition-all duration-300 h-full flex flex-col">
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {product.originalPrice && (
            <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          {supplier && (
            <div className="flex items-center gap-1.5 mb-2">
              {supplier.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              <span className="text-xs text-muted-foreground truncate">{supplier.name}</span>
            </div>
          )}

          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 mb-3 text-foreground group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>

          <div className="mt-auto flex items-end justify-between pt-1">
            <div className="flex flex-col">
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through mb-0.5">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              <span className="font-display font-bold text-lg leading-none text-foreground">
                {formatPrice(product.price)}
              </span>
            </div>
            <Button
              size="icon"
              onClick={handleAddToCart}
              className="h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
