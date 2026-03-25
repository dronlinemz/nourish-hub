import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingBag, ArrowLeft, Plus, Pencil, Trash2,
  BadgeCheck, CheckCircle, XCircle, Truck, Star, TrendingUp, AlertCircle,
  BarChart3, DollarSign, Eye, Search, Megaphone, Play, Pause, Calendar,
  MousePointerClick, Monitor, FileText, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/contexts/StoreContext";
import { CATEGORY_LABELS, ORDER_STATUS_LABELS, AD_SPACE_LABELS, AD_STATUS_LABELS, DELIVERY_ZONE_LABELS } from "@/types/store";
import type { Product, Supplier, Category, Order, OrderStatus, AdCampaign, AdSpace, AdStatus } from "@/types/store";
import { toast } from "sonner";
import { generatePartnerRevenueReport, generateAdRevenueReport, openReport } from "@/utils/reports";

type Tab = "dashboard" | "products" | "suppliers" | "orders" | "ads" | "reports";

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Painel", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "products", label: "Produtos", icon: <Package className="w-4 h-4" /> },
    { id: "suppliers", label: "Fornecedores", icon: <Users className="w-4 h-4" /> },
    { id: "orders", label: "Encomendas", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "ads", label: "Publicidade", icon: <Megaphone className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-lg shadow-sidebar-primary/20">
              <span className="text-sidebar-primary-foreground font-display font-extrabold text-sm">Dr</span>
            </div>
            <div>
              <span className="font-display font-bold text-sm block leading-tight">DrOnline</span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à Loja
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar z-50 border-t border-sidebar-border flex safe-area-bottom">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
              tab === t.id ? "text-sidebar-primary" : "text-sidebar-foreground/50"
            }`}
          >
            {t.icon}
            <span className="mt-1 font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "suppliers" && <SuppliersTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "ads" && <AdsTab />}
        </div>
      </main>
    </div>
  );
};

const formatPrice = (p: number) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(p);

/* ─── Dashboard ─── */
const DashboardTab = () => {
  const { products, suppliers, orders, adCampaigns } = useStore();
  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const adRevenue = adCampaigns.reduce((s, a) => s + a.realizedRevenue, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "payment-submitted").length;
  const lowStock = products.filter((p) => p.stock < 10).length;

  const stats = [
    { label: "Produtos", value: products.length, icon: <Package className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "Fornecedores", value: suppliers.length, icon: <Users className="w-5 h-5" />, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Receita Vendas", value: formatPrice(totalRevenue), icon: <DollarSign className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "Receita Publicidade", value: formatPrice(adRevenue), icon: <Megaphone className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Painel de Controlo</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do seu marketplace</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
              <p className="text-2xl font-display font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(pendingOrders > 0 || lowStock > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {pendingOrders > 0 && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0"><AlertCircle className="w-5 h-5" /></div>
                <div>
                  <p className="font-display font-semibold text-sm">{pendingOrders} encomendas pendentes</p>
                  <p className="text-xs text-muted-foreground">A aguardar verificação de pagamento</p>
                </div>
              </CardContent>
            </Card>
          )}
          {lowStock > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0"><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <p className="font-display font-semibold text-sm">{lowStock} produtos com stock baixo</p>
                  <p className="text-xs text-muted-foreground">Menos de 10 unidades disponíveis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Encomendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma encomenda ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-semibold">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("pt-MZ")} • {o.items.length} itens</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant={o.status === "payment-verified" || o.status === "delivered" ? "default" : "secondary"} className="text-[10px]">{ORDER_STATUS_LABELS[o.status]}</Badge>
                    <span className="font-display font-bold text-sm">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── Products ─── */
const ProductsTab = () => {
  const { products, suppliers, setProducts } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", price: "", originalPrice: "", image: "", category: "" as Category | "",
    supplierId: "", stock: "", featured: false,
  });

  const filtered = products.filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: "", originalPrice: "", image: "", category: "", supplierId: "", stock: "", featured: false });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      image: p.image, category: p.category, supplierId: p.supplierId,
      stock: String(p.stock), featured: p.featured,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price || !form.category || !form.supplierId) { toast.error("Preencha os campos obrigatórios"); return; }
    const data: Product = {
      id: editProduct?.id || `prod-${Date.now()}`, name: form.name, description: form.description, price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      image: form.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
      category: form.category as Category, supplierId: form.supplierId,
      stock: Number(form.stock) || 0, featured: form.featured,
      createdAt: editProduct?.createdAt || new Date().toISOString(),
    };
    if (editProduct) {
      setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      toast.success("Produto actualizado");
    } else {
      setProducts((prev) => [...prev, data]);
      toast.success("Produto adicionado");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setProducts((prev) => prev.filter((p) => p.id !== id)); toast.success("Produto removido"); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produtos no catálogo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20"><Plus className="w-4 h-4 mr-1.5" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Preço (MZN) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Preço Original</Label><Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div><Label>URL da Imagem</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="rounded-xl" /></div>
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor *</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl" /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium">Destaque</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground rounded-xl">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar produtos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      <Card className="overflow-hidden">
        <div className="hidden sm:grid grid-cols-[auto_1fr_120px_80px_80px_80px] gap-4 items-center px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="w-10" /><span>Produto</span><span>Categoria</span><span className="text-right">Preço</span><span className="text-center">Stock</span><span className="text-center">Acções</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((p) => {
            const supplier = suppliers.find((s) => s.id === p.supplierId);
            return (
              <div key={p.id} className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_120px_80px_80px_80px] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors">
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{supplier?.name}</p>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] w-fit">{CATEGORY_LABELS[p.category]}</Badge>
                <span className="hidden sm:block font-display font-bold text-sm text-right">{formatPrice(p.price)}</span>
                <div className="hidden sm:flex justify-center">
                  <Badge variant={p.stock < 10 ? "destructive" : "secondary"} className="text-[10px]">{p.stock}</Badge>
                </div>
                <div className="flex gap-1 justify-end sm:justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

/* ─── Suppliers ─── */
const SuppliersTab = () => {
  const { suppliers, products, setSuppliers } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", description: "", contactEmail: "", contactPhone: "", rating: "5", verified: true });

  const openNew = () => { setEditSupplier(null); setForm({ name: "", description: "", contactEmail: "", contactPhone: "", rating: "5", verified: true }); setDialogOpen(true); };
  const openEdit = (s: Supplier) => { setEditSupplier(s); setForm({ name: s.name, description: s.description, contactEmail: s.contactEmail, contactPhone: s.contactPhone, rating: String(s.rating), verified: s.verified }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.contactEmail) { toast.error("Preencha os campos obrigatórios"); return; }
    const data: Supplier = {
      id: editSupplier?.id || `sup-${Date.now()}`, name: form.name, description: form.description,
      contactEmail: form.contactEmail, contactPhone: form.contactPhone,
      rating: Number(form.rating), verified: form.verified,
      createdAt: editSupplier?.createdAt || new Date().toISOString(),
    };
    if (editSupplier) { setSuppliers((prev) => prev.map((s) => (s.id === data.id ? data : s))); toast.success("Fornecedor actualizado"); }
    else { setSuppliers((prev) => [...prev, data]); toast.success("Fornecedor adicionado"); }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setSuppliers((prev) => prev.filter((s) => s.id !== id)); toast.success("Fornecedor removido"); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} fornecedores registados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20"><Plus className="w-4 h-4 mr-1.5" /> Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email *</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Telefone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="rounded-xl" /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium">Verificado</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground rounded-xl">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => {
          const productCount = products.filter((p) => p.supplierId === s.id).length;
          return (
            <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-display font-bold text-sm">{s.name.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-sm">{s.name}</h3>
                        {s.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span className="text-xs font-medium">{s.rating}</span>
                        <span className="text-xs text-muted-foreground">• {productCount} produtos</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
                <Separator className="my-3" />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="truncate">{s.contactEmail}</span>
                  <span className="flex-shrink-0">{s.contactPhone}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Orders ─── */
const OrdersTab = () => {
  const { orders, updateOrderStatus } = useStore();

  const statusActions: Record<string, { next: OrderStatus; label: string; icon: React.ReactNode; variant: "default" | "outline" | "destructive" }[]> = {
    "pending": [{ next: "cancelled", label: "Cancelar", icon: <XCircle className="w-3.5 h-3.5" />, variant: "outline" }],
    "payment-submitted": [
      { next: "payment-verified", label: "Verificar Pagamento", icon: <CheckCircle className="w-3.5 h-3.5" />, variant: "default" },
      { next: "cancelled", label: "Cancelar", icon: <XCircle className="w-3.5 h-3.5" />, variant: "outline" },
    ],
    "payment-verified": [{ next: "shipped", label: "Marcar como Enviado", icon: <Truck className="w-3.5 h-3.5" />, variant: "default" }],
    "shipped": [{ next: "delivered", label: "Marcar como Entregue", icon: <CheckCircle className="w-3.5 h-3.5" />, variant: "default" }],
  };

  const statusColor = (status: OrderStatus) => {
    switch (status) {
      case "payment-verified": case "delivered": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Encomendas</h1>
        <p className="text-sm text-muted-foreground">{orders.length} encomendas registadas</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-display font-semibold text-muted-foreground">Nenhuma encomenda registada</p>
          <p className="text-sm text-muted-foreground/70 mt-1">As encomendas aparecerão aqui quando os clientes fizerem compras</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag className="w-5 h-5" /></div>
                    <div>
                      <p className="font-display font-bold text-sm">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerPhone} • {new Date(o.createdAt).toLocaleDateString("pt-MZ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColor(o.status)} className="text-[10px]">{ORDER_STATUS_LABELS[o.status]}</Badge>
                    <p className="font-display font-bold mt-1">{formatPrice(o.total)}</p>
                  </div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Pagamento: {o.paymentMethod === "mpesa" ? "M-Pesa" : "Transferência Bancária"}</span>
                    {o.paymentProofUrl && (
                      <a href={o.paymentProofUrl} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> Ver comprovativo</a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Endereço: {o.customerAddress}</p>
                </div>
                <div className="space-y-1.5 mb-4">
                  {o.items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}× {item.product.name}</span>
                      <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {statusActions[o.status] && (
                  <div className="flex gap-2 pt-3 border-t border-border">
                    {statusActions[o.status].map((action) => (
                      <Button key={action.next} variant={action.variant} size="sm" className="rounded-xl" onClick={() => { updateOrderStatus(o.id, action.next); toast.success(`Estado alterado para: ${ORDER_STATUS_LABELS[action.next]}`); }}>
                        {action.icon}<span className="ml-1.5">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Ads / Publicidade ─── */
const AdsTab = () => {
  const { adCampaigns, setAdCampaigns } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAd, setEditAd] = useState<AdCampaign | null>(null);
  const [filterSpace, setFilterSpace] = useState<AdSpace | "all">("all");
  const [form, setForm] = useState({
    partner: "", title: "", description: "", cta: "", url: "", image: "",
    space: "" as AdSpace | "", status: "active" as AdStatus,
    startDate: "", endDate: "", expectedRevenue: "", realizedRevenue: "",
  });

  const filtered = adCampaigns.filter((a) => filterSpace === "all" || a.space === filterSpace);

  // Group by space for overview
  const spaceStats = (Object.keys(AD_SPACE_LABELS) as AdSpace[]).map((space) => {
    const ads = adCampaigns.filter((a) => a.space === space);
    const activeAds = ads.filter((a) => a.status === "active").length;
    const totalExpected = ads.reduce((s, a) => s + a.expectedRevenue, 0);
    const totalRealized = ads.reduce((s, a) => s + a.realizedRevenue, 0);
    return { space, label: AD_SPACE_LABELS[space], count: ads.length, activeAds, totalExpected, totalRealized };
  });

  const totalExpected = adCampaigns.reduce((s, a) => s + a.expectedRevenue, 0);
  const totalRealized = adCampaigns.reduce((s, a) => s + a.realizedRevenue, 0);
  const totalImpressions = adCampaigns.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = adCampaigns.reduce((s, a) => s + a.clicks, 0);

  const openNew = () => {
    setEditAd(null);
    setForm({ partner: "", title: "", description: "", cta: "", url: "", image: "", space: "", status: "active", startDate: "", endDate: "", expectedRevenue: "", realizedRevenue: "" });
    setDialogOpen(true);
  };

  const openEdit = (ad: AdCampaign) => {
    setEditAd(ad);
    setForm({
      partner: ad.partner, title: ad.title, description: ad.description, cta: ad.cta, url: ad.url, image: ad.image,
      space: ad.space, status: ad.status, startDate: ad.startDate, endDate: ad.endDate,
      expectedRevenue: String(ad.expectedRevenue), realizedRevenue: String(ad.realizedRevenue),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.partner || !form.title || !form.space) { toast.error("Preencha os campos obrigatórios"); return; }
    const data: AdCampaign = {
      id: editAd?.id || `ad-${Date.now()}`,
      partner: form.partner, title: form.title, description: form.description,
      cta: form.cta || "Ver Mais", url: form.url || "#",
      image: form.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=200&fit=crop",
      space: form.space as AdSpace, status: form.status,
      startDate: form.startDate || new Date().toISOString().split("T")[0],
      endDate: form.endDate || "",
      expectedRevenue: Number(form.expectedRevenue) || 0,
      realizedRevenue: Number(form.realizedRevenue) || 0,
      impressions: editAd?.impressions || 0,
      clicks: editAd?.clicks || 0,
      createdAt: editAd?.createdAt || new Date().toISOString(),
    };
    if (editAd) {
      setAdCampaigns((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      toast.success("Campanha actualizada");
    } else {
      setAdCampaigns((prev) => [...prev, data]);
      toast.success("Campanha criada");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdCampaigns((prev) => prev.filter((a) => a.id !== id)); toast.success("Campanha removida"); };

  const toggleStatus = (ad: AdCampaign) => {
    const newStatus: AdStatus = ad.status === "active" ? "paused" : "active";
    setAdCampaigns((prev) => prev.map((a) => (a.id === ad.id ? { ...a, status: newStatus } : a)));
    toast.success(`Campanha ${newStatus === "active" ? "activada" : "pausada"}`);
  };

  const statusBadgeVariant = (status: AdStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "ended": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Gestão de Publicidade</h1>
          <p className="text-sm text-muted-foreground">Gerir espaços publicitários, campanhas e receitas de parceiros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-1.5" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editAd ? "Editar Campanha" : "Nova Campanha"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Parceiro *</Label><Input value={form.partner} onChange={(e) => setForm({ ...form, partner: e.target.value })} placeholder="Nome do parceiro" className="rounded-xl" /></div>
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>CTA (Botão)</Label><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Ver Ofertas" className="rounded-xl" /></div>
                <div><Label>URL Destino</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="rounded-xl" /></div>
              </div>
              <div><Label>URL da Imagem</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Espaço *</Label>
                  <Select value={form.space} onValueChange={(v) => setForm({ ...form, space: v as AdSpace })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar espaço" /></SelectTrigger>
                    <SelectContent>{(Object.entries(AD_SPACE_LABELS) as [AdSpace, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AdStatus })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.entries(AD_STATUS_LABELS) as [AdStatus, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data Início</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Data Fim</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-xl" /></div>
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receitas (MZN)</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Receita Prevista</Label><Input type="number" value={form.expectedRevenue} onChange={(e) => setForm({ ...form, expectedRevenue: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Receita Realizada</Label><Input type="number" value={form.realizedRevenue} onChange={(e) => setForm({ ...form, realizedRevenue: e.target.value })} className="rounded-xl" /></div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground rounded-xl">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3"><DollarSign className="w-5 h-5" /></div>
            <p className="text-2xl font-display font-bold">{formatPrice(totalExpected)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Receita Prevista</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3"><TrendingUp className="w-5 h-5" /></div>
            <p className="text-2xl font-display font-bold">{formatPrice(totalRealized)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Receita Realizada</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-3"><Eye className="w-5 h-5" /></div>
            <p className="text-2xl font-display font-bold">{totalImpressions.toLocaleString("pt-MZ")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Impressões Totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3"><MousePointerClick className="w-5 h-5" /></div>
            <p className="text-2xl font-display font-bold">{totalClicks.toLocaleString("pt-MZ")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cliques Totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Space Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" /> Receitas por Espaço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {spaceStats.map((ss) => {
              const pct = ss.totalExpected > 0 ? Math.round((ss.totalRealized / ss.totalExpected) * 100) : 0;
              return (
                <div
                  key={ss.space}
                  onClick={() => setFilterSpace(filterSpace === ss.space ? "all" : ss.space)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    filterSpace === ss.space ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-display font-semibold">{ss.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{ss.activeAds} activo{ss.activeAds !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Realizado / Previsto</p>
                      <p className="text-sm font-bold">{formatPrice(ss.totalRealized)} <span className="text-muted-foreground font-normal">/ {formatPrice(ss.totalExpected)}</span></p>
                    </div>
                    <span className={`text-lg font-display font-bold ${pct >= 70 ? "text-primary" : pct >= 40 ? "text-accent" : "text-destructive"}`}>{pct}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-primary" : pct >= 40 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter label */}
      {filterSpace !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Filtro: {AD_SPACE_LABELS[filterSpace]}</Badge>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setFilterSpace("all")}>Limpar filtro</Button>
        </div>
      )}

      {/* Campaign List */}
      <Card className="overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_140px_100px_100px_100px_80px] gap-4 items-center px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Campanha</span><span>Espaço</span><span>Estado</span><span className="text-right">Prevista</span><span className="text-right">Realizada</span><span className="text-center">Acções</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma campanha {filterSpace !== "all" ? "neste espaço" : "registada"}</p>
            </div>
          ) : (
            filtered.map((ad) => (
              <div key={ad.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_100px_100px_100px_80px] gap-4 items-center px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={ad.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm truncate">{ad.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{ad.partner} • {ad.startDate} → {ad.endDate || "∞"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] w-fit">{AD_SPACE_LABELS[ad.space]}</Badge>
                <Badge variant={statusBadgeVariant(ad.status)} className="hidden sm:inline-flex text-[10px] w-fit">{AD_STATUS_LABELS[ad.status]}</Badge>
                <span className="hidden sm:block text-sm text-right">{formatPrice(ad.expectedRevenue)}</span>
                <span className="hidden sm:block text-sm font-bold text-right">{formatPrice(ad.realizedRevenue)}</span>
                <div className="flex gap-0.5 justify-end sm:justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toggleStatus(ad)} title={ad.status === "active" ? "Pausar" : "Activar"}>
                    {ad.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(ad)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(ad.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Partner Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Resumo por Parceiro</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const partnerMap = new Map<string, { spaces: Set<string>; campaigns: number; expected: number; realized: number }>();
            adCampaigns.forEach((a) => {
              const p = partnerMap.get(a.partner) || { spaces: new Set(), campaigns: 0, expected: 0, realized: 0 };
              p.spaces.add(a.space);
              p.campaigns++;
              p.expected += a.expectedRevenue;
              p.realized += a.realizedRevenue;
              partnerMap.set(a.partner, p);
            });
            return (
              <div className="space-y-3">
                {Array.from(partnerMap.entries()).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm">{name.charAt(0)}</div>
                      <div>
                        <p className="font-display font-semibold text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.campaigns} campanha{data.campaigns > 1 ? "s" : ""} • {data.spaces.size} espaço{data.spaces.size > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm">{formatPrice(data.realized)}</p>
                      <p className="text-xs text-muted-foreground">de {formatPrice(data.expected)} previsto</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
