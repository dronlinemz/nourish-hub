import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useCart } from "@/contexts/CartContext";
import PartnerBanner from "@/components/PartnerBanner";

const CartPage = () => {
  const { items, removeItem, updateQuantity, total } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-display font-semibold mb-2">Carrinho vazio</p>
            <p className="text-sm text-muted-foreground mb-4">Adicione produtos para começar</p>
            <Link to="/"><Button className="bg-primary text-primary-foreground">Ver Produtos</Button></Link>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="container flex-1 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Continuar a comprar
        </Link>
        <h1 className="text-2xl font-display font-bold mb-6">Carrinho</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.product.id} className="flex gap-4 p-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm truncate">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="font-display font-bold text-sm">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                  <button onClick={() => removeItem(item.product.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 h-fit">
            <h3 className="font-display font-bold mb-4">Resumo</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envio</span>
                <span className="text-primary font-medium">A calcular</span>
              </div>
            </div>
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between font-display font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Finalizar Compra
              </Button>
            </Link>
          </Card>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default CartPage;
