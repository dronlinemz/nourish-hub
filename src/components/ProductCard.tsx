import { Link } from "react-router-dom";
import { ShoppingCart, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);
  };

  return (
    <Link to={`/produto/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.originalPrice && (
            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-display font-semibold text-sm line-clamp-2 mb-1 text-foreground">
            {product.name}
          </h3>

          {supplier && (
            <div className="flex items-center gap-1 mb-2">
              {supplier.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
              <span className="text-xs text-muted-foreground">{supplier.name}</span>
            </div>
          )}

          <div className="mt-auto flex items-end justify-between pt-2">
            <div>
              <span className="font-display font-bold text-lg text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
