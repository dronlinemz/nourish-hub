import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Building2, Upload, CheckCircle, Download, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { calculateIva, DELIVERY_ZONE_LABELS } from "@/types/store";
import type { PaymentMethod, DeliveryZone, Order } from "@/types/store";
import { toast } from "sonner";
import { downloadInvoice } from "@/utils/invoice";
import { useCreateOrder } from "@/hooks/useOrders";

const CheckoutPage = () => {
  const { items, total: subtotalRaw, clearCart, deliveryZone, setDeliveryZone } = useCart();
  const { deliveryFees, bankDetails } = useStore();
  const bankTransferReady = Boolean(bankDetails.bankName && bankDetails.account && bankDetails.nib && bankDetails.accountHolder);
  // M-Pesa remains disabled until server credentials and the Vodacom callback are configured.
  const mpesaAvailable = false;
  const paymentAvailable = mpesaAvailable || bankTransferReady;
  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", nuit: "" });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);

  const subtotal = subtotalRaw;
  const iva = calculateIva(subtotal);
  const deliveryFee = deliveryFees[deliveryZone];
  const grandTotal = subtotal + iva + deliveryFee;

  if (items.length === 0 && !submitted) {
    navigate("/carrinho");
    return null;
  }

  if (submitted && lastOrder) {
    const canDownloadInvoice = ["payment-verified", "shipped", "delivered"].includes(lastOrder.status);
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">Encomenda Submetida!</h2>
            <p className="text-muted-foreground mb-6">
              {paymentMethod === "mpesa"
                ? "Receberá uma notificação M-Pesa no seu telemóvel para confirmar o pagamento. A factura estará disponível após a confirmação do pagamento."
                : "O seu comprovativo foi enviado. A equipa irá verificar e confirmar em breve."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canDownloadInvoice ? (
                <Button onClick={() => downloadInvoice(lastOrder)} variant="outline" className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" /> Descarregar Factura
                </Button>
              ) : (
                <Button variant="outline" className="rounded-xl" disabled>
                  <Clock className="w-4 h-4 mr-2" /> Factura disponível após pagamento
                </Button>
              )}
              <Link to="/"><Button className="bg-primary text-primary-foreground rounded-xl">Voltar à Loja</Button></Link>
            </div>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (paymentMethod === "mpesa" && !mpesaAvailable) {
      toast.error("O pagamento M-Pesa ainda está em integração com a Vodacom.");
      return;
    }
    if (paymentMethod === "bank-transfer" && !bankTransferReady) {
      toast.error("A transferência bancária ainda não está configurada. Escolha M-Pesa ou contacte o suporte.");
      return;
    }
    if (paymentMethod === "bank-transfer" && !proofFile) {
      toast.error("Anexe o comprovativo de transferência");
      return;
    }

    try {
      const orderData = {
        items: [...items],
        subtotal,
        iva,
        deliveryFee,
        deliveryZone,
        total: grandTotal,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerAddress: form.address,
        customerNuit: form.nuit || undefined,
        paymentMethod,
        paymentProofUrl: undefined,
        status: (paymentMethod === "mpesa" ? "pending" : "payment-submitted") as Order["status"],
      };

      const result = await createOrder.mutateAsync({ order: orderData, items: [...items], proofFile });
      clearCart();
      setLastOrder(result);
      setSubmitted(true);
      toast.success("Encomenda submetida com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao submeter encomenda. Tente novamente.");
      console.error(err);
    }
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
              <Card className="p-6 rounded-xl">
                <h2 className="font-display font-bold mb-4">Informações do Cliente</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Nome Completo *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-xl" /></div>
                  <div><Label htmlFor="phone">Telefone *</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+258 84..." required className="rounded-xl" /></div>
                  <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" /></div>
                  <div><Label htmlFor="nuit">NUIT (opcional)</Label><Input id="nuit" value={form.nuit} onChange={(e) => setForm({ ...form, nuit: e.target.value })} placeholder="Nº de contribuinte" className="rounded-xl" /></div>
                  <div className="sm:col-span-2"><Label htmlFor="address">Endereço de Entrega *</Label><Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="rounded-xl" /></div>
                </div>
              </Card>

              {/* Delivery Zone - persisted from cart */}
              <Card className="p-6 rounded-xl">
                <h2 className="font-display font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Zona de Entrega
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(Object.entries(DELIVERY_ZONE_LABELS) as [DeliveryZone, string][]).map(([zone, label]) => (
                    <button key={zone} type="button" onClick={() => setDeliveryZone(zone)}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${deliveryZone === zone ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                      <p className="font-display font-semibold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">Taxa de entrega: {formatPrice(deliveryFees[zone])}</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Payment */}
              <Card className="p-6 rounded-xl">
                <h2 className="font-display font-bold mb-4">Método de Pagamento</h2>
                {!paymentAvailable && <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">Os meios de pagamento ainda não estão activos. A integração M-Pesa aguarda credenciais e validação da Vodacom; a transferência bancária aguarda os dados oficiais da conta.</p>}
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <button type="button" disabled={!mpesaAvailable} onClick={() => setPaymentMethod("mpesa")}
                    className={`p-4 rounded-xl border-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${paymentMethod === "mpesa" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <Smartphone className="w-5 h-5 text-primary mb-2" />
                    <p className="font-display font-semibold text-sm">M-Pesa</p>
                    <p className="text-xs text-muted-foreground">{mpesaAvailable ? "Pagamento via M-Pesa" : "Em integração com a Vodacom"}</p>
                  </button>
                  <button type="button" disabled={!bankTransferReady} onClick={() => setPaymentMethod("bank-transfer")}
                    className={`p-4 rounded-xl border-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${paymentMethod === "bank-transfer" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <Building2 className="w-5 h-5 text-secondary mb-2" />
                    <p className="font-display font-semibold text-sm">Transferência Bancária</p>
                    <p className="text-xs text-muted-foreground">{bankTransferReady ? "Envie o comprovativo após transferência" : "Indisponível: dados bancários por configurar"}</p>
                  </button>
                </div>

                {paymentMethod === "mpesa" && mpesaAvailable && (
                  <div className="bg-primary/5 rounded-xl p-4">
                    <p className="text-sm font-medium mb-1">Instruções M-Pesa</p>
                    <p className="text-sm text-muted-foreground">
                      Após submeter a encomenda, receberá uma notificação no número indicado para confirmar o pagamento de{" "}
                      <strong className="text-foreground">{formatPrice(grandTotal)}</strong>. A factura será disponibilizada após a confirmação.
                    </p>
                  </div>
                )}

                {paymentMethod === "bank-transfer" && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-sm font-medium mb-1">Dados Bancários</p>
                      {bankTransferReady ? (
                        <p className="text-sm text-muted-foreground">
                          Banco: {bankDetails.bankName}<br />Conta: {bankDetails.account}<br />NIB: {bankDetails.nib}<br />Titular: {bankDetails.accountHolder}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Os dados bancários ainda não foram configurados pela administração. Utilize M-Pesa ou contacte o suporte.</p>
                      )}
                    </div>
                    <div>
                      <Label>Comprovativo de Pagamento *</Label>
                      <div className="mt-2 border-2 border-dashed rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                        <input type="file" accept="image/*,.pdf" className="hidden" id="proof-upload"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                        <label htmlFor="proof-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          {proofFile ? (
                            <p className="text-sm font-medium text-primary">{proofFile.name}</p>
                          ) : (
                            <><p className="text-sm font-medium">Clique para anexar</p><p className="text-xs text-muted-foreground">PDF ou imagem do comprovativo</p></>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <Card className="p-6 h-fit rounded-xl">
              <h3 className="font-display font-bold mb-4">Resumo da Encomenda</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[60%]">{item.quantity}x {item.product.name}</span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">IVA (16%)</span><span>{formatPrice(iva)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Entrega ({DELIVERY_ZONE_LABELS[deliveryZone]})</span><span>{formatPrice(deliveryFee)}</span></div>
              </div>
              <div className="border-t border-border pt-3 mb-4">
                <div className="flex justify-between font-display font-bold text-lg"><span>Total</span><span className="text-primary">{formatPrice(grandTotal)}</span></div>
              </div>
              <Button type="submit" disabled={createOrder.isPending || !paymentAvailable || (paymentMethod === "mpesa" && !mpesaAvailable) || (paymentMethod === "bank-transfer" && !bankTransferReady)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                <CreditCard className="w-4 h-4 mr-2" /> {createOrder.isPending ? "A submeter..." : "Confirmar Encomenda"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                {paymentMethod === "mpesa" ? "A factura será gerada após confirmação do pagamento M-Pesa" : "Ao confirmar, será gerada uma factura electrónica"}
              </p>
            </Card>
          </div>
        </form>
      </main>
      <StoreFooter />
    </div>
  );
};

export default CheckoutPage;
