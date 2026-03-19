import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Building2, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import type { PaymentMethod, Order } from "@/types/store";
import { toast } from "sonner";

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { addOrder } = useStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);

  if (items.length === 0 && !submitted) {
    navigate("/carrinho");
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">Encomenda Submetida!</h2>
            <p className="text-muted-foreground mb-6">
              {paymentMethod === "mpesa"
                ? "Receberá uma notificação M-Pesa no seu telemóvel para confirmar o pagamento."
                : "O seu comprovativo foi enviado. A equipa irá verificar e confirmar em breve."}
            </p>
            <Link to="/"><Button className="bg-primary text-primary-foreground">Voltar à Loja</Button></Link>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (paymentMethod === "bank-transfer" && !proofFile) {
      toast.error("Anexe o comprovativo de transferência");
      return;
    }

    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: [...items],
      total,
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      customerAddress: form.address,
      paymentMethod,
      paymentProofUrl: proofFile ? URL.createObjectURL(proofFile) : undefined,
      status: paymentMethod === "mpesa" ? "pending" : "payment-submitted",
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    clearCart();
    setSubmitted(true);
    toast.success("Encomenda submetida com sucesso!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="container flex-1 py-8">
        <Link to="/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
        </Link>
        <h1 className="text-2xl font-display font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card className="p-6">
                <h2 className="font-display font-bold mb-4">Informações do Cliente</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+258 84..." required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Endereço de Entrega *</Label>
                    <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  </div>
                </div>
              </Card>

              {/* Payment */}
              <Card className="p-6">
                <h2 className="font-display font-bold mb-4">Método de Pagamento</h2>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      paymentMethod === "mpesa"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-primary mb-2" />
                    <p className="font-display font-semibold text-sm">M-Pesa</p>
                    <p className="text-xs text-muted-foreground">Pagamento instantâneo via M-Pesa</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank-transfer")}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      paymentMethod === "bank-transfer"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-secondary mb-2" />
                    <p className="font-display font-semibold text-sm">Transferência Bancária</p>
                    <p className="text-xs text-muted-foreground">Envie o comprovativo após transferência</p>
                  </button>
                </div>

                {paymentMethod === "mpesa" && (
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Instruções M-Pesa</p>
                    <p className="text-sm text-muted-foreground">
                      Após submeter a encomenda, receberá uma notificação no número indicado para confirmar o pagamento de{" "}
                      <strong className="text-foreground">{formatPrice(total)}</strong>.
                    </p>
                  </div>
                )}

                {paymentMethod === "bank-transfer" && (
                  <div className="space-y-4">
                    <div className="bg-info/5 rounded-lg p-4">
                      <p className="text-sm font-medium mb-1">Dados Bancários</p>
                      <p className="text-sm text-muted-foreground">
                        Banco: BCI Moçambique<br />
                        Conta: 1234567890<br />
                        NIB: 0008 0000 1234567890 12<br />
                        Titular: DrOnline Lda
                      </p>
                    </div>
                    <div>
                      <Label>Comprovativo de Pagamento *</Label>
                      <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          id="proof-upload"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="proof-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          {proofFile ? (
                            <p className="text-sm font-medium text-primary">{proofFile.name}</p>
                          ) : (
                            <>
                              <p className="text-sm font-medium">Clique para anexar</p>
                              <p className="text-xs text-muted-foreground">PDF ou imagem do comprovativo</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <Card className="p-6 h-fit">
              <h3 className="font-display font-bold mb-4">Resumo da Encomenda</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[60%]">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mb-4">
                <div className="flex justify-between font-display font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <CreditCard className="w-4 h-4 mr-2" />
                Confirmar Encomenda
              </Button>
            </Card>
          </div>
        </form>
      </main>
      <StoreFooter />
    </div>
  );
};

export default CheckoutPage;
