import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, Shield, Truck, CreditCard, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import PartnerBanner from "@/components/PartnerBanner";
import { IVA_RATE, DELIVERY_ZONE_LABELS } from "@/types/store";
import type { DeliveryZone } from "@/types/store";

const CartPage = () => {
  const { items, removeItem, updateQuantity, total, deliveryZone, setDeliveryZone } = useCart();
  const { deliveryFees } = useStore();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-9 h-9 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-display font-bold mb-2">Carrinho vazio</p>
            <p className="text-sm text-muted-foreground mb-6">Ainda não adicionou nenhum produto</p>
            <Link to="/">
              <Button className="bg-primary text-primary-foreground rounded-xl px-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Explorar Produtos
              </Button>
            </Link>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />
      <div className="border-b border-border bg-card/50">
        <div className="container py-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Continuar a comprar
          </Link>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-display font-bold">Carrinho</h1>
            <span className="text-sm text-muted-foreground">({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
          </div>
        </div>
      </div>

      <main className="container flex-1 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.product.id} className="flex gap-4 p-4 rounded-xl border-border hover:shadow-md transition-shadow">
                <Link to={`/produto/${item.product.id}`} className="flex-shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-24 h-24 rounded-lg object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/produto/${item.product.id}`}>
                    <h3 className="font-display font-semibold text-sm hover:text-primary transition-colors truncate">{item.product.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">{formatPrice(item.product.price)} / unidade</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-semibold w-8 text-center border-x border-border">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-display font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              </Card>
            ))}
            <PartnerBanner variant="compact" className="mt-4" />
          </div>

          <div className="space-y-4">
            <Card className="p-6 rounded-xl border-border">
              <h3 className="font-display font-bold text-lg mb-5">Resumo da Encomenda</h3>
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Zona de Entrega
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(DELIVERY_ZONE_LABELS) as [DeliveryZone, string][]).map(([zone, label]) => (
                    <button
                      key={zone}
                      onClick={() => setDeliveryZone(zone)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                        deliveryZone === zone
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {label} — {formatPrice(deliveryFees[zone])}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} itens)</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span className="font-medium">{formatPrice(total * IVA_RATE)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrega ({DELIVERY_ZONE_LABELS[deliveryZone]})</span>
                  <span className="font-medium">{formatPrice(deliveryFees[deliveryZone])}</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mb-5">
                <div className="flex justify-between font-display font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total + total * IVA_RATE + deliveryFees[deliveryZone])}</span>
                </div>
              </div>
              <Link to="/checkout">
                <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold">
                  Finalizar Compra
                </Button>
              </Link>
            </Card>
            <div className="space-y-2.5">
              {[
                { icon: <Shield className="w-4 h-4 text-primary" />, text: "Compra 100% segura" },
                { icon: <Truck className="w-4 h-4 text-primary" />, text: "Entrega em Maputo e Matola" },
                { icon: <CreditCard className="w-4 h-4 text-primary" />, text: "M-Pesa & Transferência" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default CartPage;
