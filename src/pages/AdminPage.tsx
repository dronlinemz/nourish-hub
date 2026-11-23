import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingBag, ArrowLeft, Plus, Pencil, Trash2,
  BadgeCheck, CheckCircle, XCircle, Truck, Star, TrendingUp, AlertCircle,
  BarChart3, DollarSign, Eye, Search, Megaphone, Play, Pause, Calendar,
  MousePointerClick, Monitor, FileText, Download, Crown, Settings, Filter, MapPin
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
import type { Product, Supplier, Category, Order, OrderStatus, AdCampaign, AdSpace, AdStatus, DeliveryZone, PremiumSettings } from "@/types/store";
import { toast } from "sonner";
import { generatePartnerRevenueReport, generateAdRevenueReport, openReport } from "@/utils/reports";
import { downloadInvoice } from "@/utils/invoice";
import { getPaymentProofSignedUrl, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useDeleteProduct, useDeleteSupplier, useSaveAdminSupplier, useSaveProduct, useSetProductFeatured } from "@/hooks/useSupplierAccount";

type Tab = "dashboard" | "products" | "suppliers" | "orders" | "ads" | "reports" | "settings";

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Painel", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "products", label: "Produtos", icon: <Package className="w-4 h-4" /> },
    { id: "suppliers", label: "Fornecedores", icon: <Users className="w-4 h-4" /> },
    { id: "orders", label: "Encomendas", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "ads", label: "Publicidade", icon: <Megaphone className="w-4 h-4" /> },
    { id: "reports", label: "Relatórios", icon: <FileText className="w-4 h-4" /> },
    { id: "settings", label: "Definições", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col border-r border-sidebar-border sticky top-0 h-screen">
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.id ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/"><Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar à Loja</Button></Link>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar z-50 border-t border-sidebar-border flex safe-area-bottom">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${tab === t.id ? "text-sidebar-primary" : "text-sidebar-foreground/50"}`}>
            {t.icon}<span className="mt-1 font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "suppliers" && <SuppliersTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "ads" && <AdsTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "settings" && <SettingsTab />}
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
          <Card key={s.label}><CardContent className="p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>
      {(pendingOrders > 0 || lowStock > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {pendingOrders > 0 && (
            <Card className="border-accent/30 bg-accent/5"><CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0"><AlertCircle className="w-5 h-5" /></div>
              <div><p className="font-display font-semibold text-sm">{pendingOrders} encomendas pendentes</p><p className="text-xs text-muted-foreground">A aguardar verificação de pagamento</p></div>
            </CardContent></Card>
          )}
          {lowStock > 0 && (
            <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0"><TrendingUp className="w-5 h-5" /></div>
              <div><p className="font-display font-semibold text-sm">{lowStock} produtos com stock baixo</p><p className="text-xs text-muted-foreground">Menos de 10 unidades disponíveis</p></div>
            </CardContent></Card>
          )}
        </div>
      )}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Encomendas Recentes</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground"><ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma encomenda ainda</p></div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag className="w-4 h-4" /></div>
                    <div><p className="text-sm font-semibold">{o.customerName}</p><p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("pt-MZ")} • {o.items.length} itens</p></div>
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
  const { products, suppliers } = useStore();
  const saveProduct = useSaveProduct(form.supplierId);
  const deleteProduct = useDeleteProduct();
  const setFeatured = useSetProductFeatured();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<"all" | "in-stock" | "low" | "out">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [form, setForm] = useState({ name: "", description: "", price: "", originalPrice: "", image: "", category: "" as Category | "", supplierId: "", stock: "", featured: false });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterSupplier !== "all" && p.supplierId !== filterSupplier) return false;
      if (filterStock === "out" && p.stock > 0) return false;
      if (filterStock === "low" && (p.stock === 0 || p.stock >= 10)) return false;
      if (filterStock === "in-stock" && p.stock < 10) return false;
      return true;
    });
  }, [products, searchQuery, filterCategory, filterSupplier, filterStock]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCategory, filterSupplier, filterStock]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const statsInStock = products.filter((p) => p.stock >= 10).length;
  const statsLowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const statsOutOfStock = products.filter((p) => p.stock === 0).length;
  const statsFeatured = products.filter((p) => p.featured).length;

  const openNew = () => { setEditProduct(null); setForm({ name: "", description: "", price: "", originalPrice: "", image: "", category: "", supplierId: "", stock: "", featured: false }); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setForm({ name: p.name, description: p.description, price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : "", image: p.image, category: p.category, supplierId: p.supplierId, stock: String(p.stock), featured: p.featured }); setDialogOpen(true); };

  const handleSave = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !Number.isFinite(price) || price <= 0 || !form.category || !form.supplierId || !Number.isInteger(stock) || stock < 0) {
      toast.error("Preencha os campos obrigatórios com valores válidos");
      return;
    }
    try {
      await saveProduct.mutateAsync({
        id: editProduct?.id,
        values: {
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          image: form.image.trim(),
          category: form.category as Category,
          stock,
          featured: form.featured,
        },
      });
      toast.success(editProduct ? "Produto actualizado" : "Produto adicionado");
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível guardar o produto.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Produto removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o produto.");
    }
  };

  const toggleFeatured = async (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    try {
      await setFeatured.mutateAsync({ productId: id, featured: !product.featured });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o destaque.");
    }
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="w-3 h-3" /> Esgotado</Badge>;
    if (stock < 10) return <Badge className="text-[10px] gap-1 bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"><AlertCircle className="w-3 h-3" /> {stock} un.</Badge>;
    return <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle className="w-3 h-3" /> {stock} un.</Badge>;
  };

  const hasFilters = searchQuery || filterCategory !== "all" || filterSupplier !== "all" || filterStock !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-display font-bold">Produtos</h1><p className="text-sm text-muted-foreground">Gerir catálogo e visibilidade na plataforma</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20"><Plus className="w-4 h-4 mr-1.5" /> Novo Produto</Button></DialogTrigger>
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
              <div><Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Fornecedor *</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl" /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm font-medium">Destaque</span></label></div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground rounded-xl">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => setFilterStock("all")} className={`p-3 rounded-xl border transition-all text-left ${filterStock === "all" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
          <p className="text-xl font-display font-bold">{products.length}</p>
          <p className="text-[11px] text-muted-foreground">Total produtos</p>
        </button>
        <button onClick={() => setFilterStock("in-stock")} className={`p-3 rounded-xl border transition-all text-left ${filterStock === "in-stock" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
          <p className="text-xl font-display font-bold text-primary">{statsInStock}</p>
          <p className="text-[11px] text-muted-foreground">Em stock</p>
        </button>
        <button onClick={() => setFilterStock("low")} className={`p-3 rounded-xl border transition-all text-left ${filterStock === "low" ? "border-amber-500 bg-amber-500/5" : "border-border bg-card hover:border-amber-500/30"}`}>
          <p className="text-xl font-display font-bold text-amber-600">{statsLowStock}</p>
          <p className="text-[11px] text-muted-foreground">Stock baixo</p>
        </button>
        <button onClick={() => setFilterStock("out")} className={`p-3 rounded-xl border transition-all text-left ${filterStock === "out" ? "border-destructive bg-destructive/5" : "border-border bg-card hover:border-destructive/30"}`}>
          <p className="text-xl font-display font-bold text-destructive">{statsOutOfStock}</p>
          <p className="text-[11px] text-muted-foreground">Esgotados</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar produtos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | "all")}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos fornecedores</SelectItem>
            {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filters & results count */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{filtered.length} de {products.length} produtos</span>
          <span className="text-border">•</span>
          <button onClick={() => { setSearchQuery(""); setFilterCategory("all"); setFilterSupplier("all"); setFilterStock("all"); }} className="text-xs text-primary hover:underline">Limpar filtros</button>
        </div>
      )}

      {/* Product list */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-display font-semibold text-muted-foreground">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Ajuste os filtros ou adicione novos produtos</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden lg:grid grid-cols-[48px_1fr_140px_140px_90px_100px_90px] gap-3 items-center px-5 py-3 bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
            <span />
            <span>Produto</span>
            <span>Categoria</span>
            <span>Fornecedor</span>
            <span className="text-right">Preço</span>
            <span className="text-center">Stock</span>
            <span className="text-center">Acções</span>
          </div>
          <div className="divide-y divide-border">
            {paginatedProducts.map((p) => {
              const supplier = suppliers.find((s) => s.id === p.supplierId);
              return (
                <div key={p.id} className={`grid grid-cols-[48px_1fr_auto] lg:grid-cols-[48px_1fr_140px_140px_90px_100px_90px] gap-3 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors ${p.stock === 0 ? "opacity-60" : ""}`}>
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-sm truncate">{p.name}</p>
                      {p.featured && (
                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-semibold">
                          <Star className="w-2.5 h-2.5 fill-amber-500" /> Destaque
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate lg:hidden">{supplier?.name} • {CATEGORY_LABELS[p.category]}</p>
                  </div>
                  <Badge variant="outline" className="hidden lg:inline-flex text-[10px] w-fit">{CATEGORY_LABELS[p.category]}</Badge>
                  <span className="hidden lg:block text-xs text-muted-foreground truncate">{supplier?.name}</span>
                  <div className="hidden lg:block text-right">
                    <span className="font-display font-bold text-sm">{formatPrice(p.price)}</span>
                    {p.originalPrice && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</p>}
                  </div>
                  <div className="hidden lg:flex justify-center">{stockBadge(p.stock)}</div>
                  <div className="flex gap-0.5 justify-end lg:justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title={p.featured ? "Remover destaque" : "Destacar"} onClick={() => toggleFeatured(p.id)}>
                      <Star className={`w-3.5 h-3.5 ${p.featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} produtos
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="h-8 w-8 rounded-lg p-0" onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Seguinte
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Suppliers ─── */
const SuppliersTab = () => {
  const { suppliers, products, premiumSettings } = useStore();
  const saveSupplier = useSaveAdminSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", description: "", contactEmail: "", contactPhone: "", rating: "5", verified: true, logo: "", location: "", premiumActive: false, premiumStart: "", premiumEnd: "", approved: true });

  const openNew = () => { setEditSupplier(null); setForm({ name: "", description: "", contactEmail: "", contactPhone: "", rating: "5", verified: true, logo: "", location: "", premiumActive: false, premiumStart: "", premiumEnd: "", approved: true }); setDialogOpen(true); };
  const openEdit = (s: Supplier) => { setEditSupplier(s); setForm({ name: s.name, description: s.description, contactEmail: s.contactEmail, contactPhone: s.contactPhone, rating: String(s.rating), verified: s.verified, logo: s.logo || "", location: s.location || "", premiumActive: s.premium?.active || false, premiumStart: s.premium?.startDate || "", premiumEnd: s.premium?.endDate || "", approved: s.approved ?? false }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.contactEmail.trim()) { toast.error("Nome e email são obrigatórios"); return; }
    try {
      await saveSupplier.mutateAsync({
        id: editSupplier?.id,
        values: {
          name: form.name.trim(),
          description: form.description.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          location: form.location.trim(),
          logo: form.logo.trim(),
          rating: Number(form.rating) || 0,
          verified: form.verified,
          approved: form.approved,
          premiumActive: form.premiumActive,
          premiumStartDate: form.premiumStart || null,
          premiumEndDate: form.premiumEnd || null,
          premiumAdDiscount: premiumSettings.adDiscount,
          premiumPrioritySlots: premiumSettings.prioritySlots,
        },
      });
      toast.success(editSupplier ? "Fornecedor actualizado" : "Fornecedor criado");
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível guardar o fornecedor.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success("Fornecedor removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o fornecedor.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-display font-bold">Fornecedores</h1><p className="text-sm text-muted-foreground">{suppliers.length} fornecedores registados</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20"><Plus className="w-4 h-4 mr-1.5" /> Novo Fornecedor</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div><Label>URL do Logo</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." className="rounded-xl" /></div>
              <div><Label>Localização</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Maputo, Beira, Nampula..." className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email *</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Telefone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="rounded-xl" /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm font-medium">Verificado</span></label></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm font-medium">Fornecedor aprovado para publicar produtos</span></label>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-display font-bold">Programa Premium</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.premiumActive} onChange={(e) => setForm({ ...form, premiumActive: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium">Subscrição Premium Activa</span>
                </label>
                {form.premiumActive && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Início</Label><Input type="date" value={form.premiumStart} onChange={(e) => setForm({ ...form, premiumStart: e.target.value })} className="rounded-xl" /></div>
                    <div><Label>Fim (6 meses)</Label><Input type="date" value={form.premiumEnd} onChange={(e) => setForm({ ...form, premiumEnd: e.target.value })} className="rounded-xl" /></div>
                  </div>
                )}
                {form.premiumActive && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 text-xs text-muted-foreground">
                    <p>• Destaque prioritário no marketplace</p>
                    <p>• {premiumSettings.prioritySlots} espaços publicitários com prioridade</p>
                    <p>• {Math.round(premiumSettings.adDiscount * 100)}% de desconto nas taxas de publicidade</p>
                    <p>• Subscrição de {premiumSettings.subscriptionMonths} meses</p>
                    <p>• Selo Premium DrOnline</p>
                  </div>
                )}
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
            <Card key={s.id} className={`overflow-hidden hover:shadow-md transition-shadow ${s.premium?.active ? "ring-2 ring-amber-500/30" : ""}`}>
              {s.premium?.active && (
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-1 flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-white" /><span className="text-[10px] font-bold text-white uppercase tracking-wider">Premium</span>
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" /> : <span className="text-secondary font-display font-bold text-sm">{s.name.charAt(0)}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5"><h3 className="font-display font-bold text-sm">{s.name}</h3>{s.verified && <BadgeCheck className="w-4 h-4 text-primary" />}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" /><span className="text-xs font-medium">{s.rating}</span></div>
                        <span className="text-xs text-muted-foreground">• {productCount} produtos</span>
                        {s.location && <span className="text-xs text-muted-foreground flex items-center gap-0.5">• <MapPin className="w-3 h-3" />{s.location}</span>}
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="truncate">{s.contactEmail}</span><span className="flex-shrink-0">{s.contactPhone}</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Orders (with phases and filters) ─── */
const ORDER_PHASES: { status: OrderStatus; label: string; color: string }[] = [
  { status: "pending", label: "Pendentes", color: "bg-amber-500" },
  { status: "payment-submitted", label: "Comprovativo Enviado", color: "bg-blue-500" },
  { status: "payment-verified", label: "Pagamento Verificado", color: "bg-primary" },
  { status: "shipped", label: "Enviados", color: "bg-purple-500" },
  { status: "delivered", label: "Entregues", color: "bg-primary" },
  { status: "cancelled", label: "Cancelados", color: "bg-destructive" },
];

const OrdersTab = () => {
  const { orders } = useStore();
  const updateOrder = useUpdateOrderStatus();
  const [openingProof, setOpeningProof] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrder.mutateAsync({ orderId, status });
      toast.success(`Estado alterado para: ${ORDER_STATUS_LABELS[status]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível actualizar a encomenda.");
    }
  };

  const handleOpenProof = async (path: string) => {
    setOpeningProof(path);
    try {
      const url = await getPaymentProofSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o comprovativo.");
    } finally {
      setOpeningProof(null);
    }
  };
  const [activePhase, setActivePhase] = useState<OrderStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "year">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "mpesa" | "bank-transfer">("all");
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activePhase !== "all") result = result.filter((o) => o.status === activePhase);
    if (paymentFilter !== "all") result = result.filter((o) => o.paymentMethod === paymentFilter);
    if (customerSearch) result = result.filter((o) => o.customerName.toLowerCase().includes(customerSearch.toLowerCase()) || o.customerPhone.includes(customerSearch));

    if (dateFilter !== "all") {
      const now = new Date();
      const start = new Date();
      if (dateFilter === "today") start.setHours(0, 0, 0, 0);
      else if (dateFilter === "week") start.setDate(now.getDate() - 7);
      else if (dateFilter === "month") start.setMonth(now.getMonth() - 1);
      else if (dateFilter === "year") start.setFullYear(now.getFullYear() - 1);
      result = result.filter((o) => new Date(o.createdAt) >= start);
    }
    return result;
  }, [orders, activePhase, dateFilter, paymentFilter, customerSearch]);

  const statusActions: Record<string, { next: OrderStatus; label: string; icon: React.ReactNode; variant: "default" | "outline" | "destructive" }[]> = {
    "pending": [{ next: "cancelled", label: "Cancelar", icon: <XCircle className="w-3.5 h-3.5" />, variant: "outline" }],
    "payment-submitted": [
      { next: "payment-verified", label: "Verificar", icon: <CheckCircle className="w-3.5 h-3.5" />, variant: "default" },
      { next: "cancelled", label: "Cancelar", icon: <XCircle className="w-3.5 h-3.5" />, variant: "outline" },
    ],
    "payment-verified": [{ next: "shipped", label: "Enviado", icon: <Truck className="w-3.5 h-3.5" />, variant: "default" }],
    "shipped": [{ next: "delivered", label: "Entregue", icon: <CheckCircle className="w-3.5 h-3.5" />, variant: "default" }],
  };

  const statusColor = (status: OrderStatus) => {
    switch (status) { case "payment-verified": case "delivered": return "default"; case "cancelled": return "destructive"; default: return "secondary"; }
  };

  const phaseCounts = ORDER_PHASES.map((p) => ({ ...p, count: orders.filter((o) => o.status === p.status).length }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl md:text-3xl font-display font-bold">Gestão de Encomendas</h1><p className="text-sm text-muted-foreground">{orders.length} encomendas registadas</p></div>

      {/* Phase pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActivePhase("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePhase === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          Todas ({orders.length})
        </button>
        {phaseCounts.map((p) => (
          <button key={p.status} onClick={() => setActivePhase(p.status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${activePhase === p.status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <span className={`w-2 h-2 rounded-full ${p.color}`} />{p.label} ({p.count})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> Filtros:</div>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
          <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="year">Último ano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as typeof paymentFilter)}>
          <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos pagamentos</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="bank-transfer">Transferência</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Pesquisar cliente..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-lg w-[180px]" />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-display font-semibold text-muted-foreground">Nenhuma encomenda encontrada</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Ajuste os filtros para ver resultados</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <Card key={o.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag className="w-5 h-5" /></div>
                    <div>
                      <p className="font-display font-bold text-sm">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerPhone} • {new Date(o.createdAt).toLocaleDateString("pt-MZ")} • {DELIVERY_ZONE_LABELS[o.deliveryZone]}</p>
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
                    <div className="flex items-center gap-3">
                      {o.paymentProofUrl && <button type="button" disabled={openingProof === o.paymentProofUrl} onClick={() => handleOpenProof(o.paymentProofUrl!)} className="text-primary font-medium hover:underline flex items-center gap-1 disabled:opacity-50"><Eye className="w-3 h-3" /> {openingProof === o.paymentProofUrl ? "A abrir..." : "Comprovativo"}</button>}
                      {(["payment-verified", "shipped", "delivered"].includes(o.status)) && (
                        <button onClick={() => downloadInvoice(o)} className="text-primary font-medium hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Factura</button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Endereço: {o.customerAddress}</span>
                    <span>Subtotal: {formatPrice(o.subtotal)} | IVA: {formatPrice(o.iva)} | Entrega: {formatPrice(o.deliveryFee)}</span>
                  </div>
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
                      <Button key={action.next} variant={action.variant} size="sm" className="rounded-xl" onClick={() => handleStatusChange(o.id, action.next)} disabled={updateOrder.isPending}>
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

/* ─── Ads ─── */
const AdsTab = () => {
  const { adCampaigns, setAdCampaigns, suppliers } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAd, setEditAd] = useState<AdCampaign | null>(null);
  const [filterSpace, setFilterSpace] = useState<AdSpace | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AdStatus | "all">("all");
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ADS_PER_PAGE = 8;
  const [form, setForm] = useState({ partner: "", title: "", description: "", cta: "", url: "", image: "", space: "" as AdSpace | "", status: "active" as AdStatus, startDate: "", endDate: "", expectedRevenue: "", realizedRevenue: "" });

  const partners = useMemo(() => [...new Set(adCampaigns.map((a) => a.partner))].sort(), [adCampaigns]);

  const filtered = useMemo(() => {
    return adCampaigns.filter((a) => {
      if (filterSpace !== "all" && a.space !== filterSpace) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterPartner !== "all" && a.partner !== filterPartner) return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.partner.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [adCampaigns, filterSpace, filterStatus, filterPartner, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [filterSpace, filterStatus, filterPartner, searchQuery]);

  const totalPages = Math.ceil(filtered.length / ADS_PER_PAGE);
  const paginatedAds = filtered.slice((currentPage - 1) * ADS_PER_PAGE, currentPage * ADS_PER_PAGE);

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
  const globalCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  const activeCount = adCampaigns.filter((a) => a.status === "active").length;
  const pausedCount = adCampaigns.filter((a) => a.status === "paused").length;

  const openNew = () => { setEditAd(null); setForm({ partner: "", title: "", description: "", cta: "", url: "", image: "", space: "", status: "active", startDate: "", endDate: "", expectedRevenue: "", realizedRevenue: "" }); setDialogOpen(true); };
  const openEdit = (ad: AdCampaign) => { setEditAd(ad); setForm({ partner: ad.partner, title: ad.title, description: ad.description, cta: ad.cta, url: ad.url, image: ad.image, space: ad.space, status: ad.status, startDate: ad.startDate, endDate: ad.endDate, expectedRevenue: String(ad.expectedRevenue), realizedRevenue: String(ad.realizedRevenue) }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.partner || !form.title || !form.space) { toast.error("Preencha os campos obrigatórios"); return; }
    const data: AdCampaign = { id: editAd?.id || `ad-${Date.now()}`, partner: form.partner, title: form.title, description: form.description, cta: form.cta || "Ver Mais", url: form.url || "#", image: form.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=200&fit=crop", space: form.space as AdSpace, status: form.status, startDate: form.startDate || new Date().toISOString().split("T")[0], endDate: form.endDate || "", expectedRevenue: Number(form.expectedRevenue) || 0, realizedRevenue: Number(form.realizedRevenue) || 0, impressions: editAd?.impressions || 0, clicks: editAd?.clicks || 0, createdAt: editAd?.createdAt || new Date().toISOString() };
    if (editAd) { setAdCampaigns((prev) => prev.map((a) => (a.id === data.id ? data : a))); toast.success("Campanha actualizada"); }
    else { setAdCampaigns((prev) => [...prev, data]); toast.success("Campanha criada"); }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdCampaigns((prev) => prev.filter((a) => a.id !== id)); toast.success("Campanha removida"); };
  const toggleStatus = (ad: AdCampaign) => { const ns: AdStatus = ad.status === "active" ? "paused" : "active"; setAdCampaigns((prev) => prev.map((a) => (a.id === ad.id ? { ...a, status: ns } : a))); toast.success(`Campanha ${ns === "active" ? "activada" : "pausada"}`); };
  const statusBadgeVariant = (status: AdStatus): "default" | "secondary" | "destructive" | "outline" => { switch (status) { case "active": return "default"; case "paused": return "secondary"; case "ended": return "destructive"; default: return "outline"; } };

  const hasFilters = searchQuery || filterSpace !== "all" || filterStatus !== "all" || filterPartner !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-display font-bold">Gestão de Publicidade</h1><p className="text-sm text-muted-foreground">Gerir espaços, campanhas e receitas</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20"><Plus className="w-4 h-4 mr-1.5" /> Nova Campanha</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editAd ? "Editar Campanha" : "Nova Campanha"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Parceiro *</Label><Input value={form.partner} onChange={(e) => setForm({ ...form, partner: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>CTA</Label><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Ver Ofertas" className="rounded-xl" /></div>
                <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div><Label>URL da Imagem</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Espaço *</Label><Select value={form.space} onValueChange={(v) => setForm({ ...form, space: v as AdSpace })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{(Object.entries(AD_SPACE_LABELS) as [AdSpace, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
                <div><Label>Estado</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AdStatus })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(AD_STATUS_LABELS) as [AdStatus, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data Início</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Data Fim</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-xl" /></div>
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receitas (MZN)</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Prevista</Label><Input type="number" value={form.expectedRevenue} onChange={(e) => setForm({ ...form, expectedRevenue: e.target.value })} className="rounded-xl" /></div>
                <div><Label>Realizada</Label><Input type="number" value={form.realizedRevenue} onChange={(e) => setForm({ ...form, realizedRevenue: e.target.value })} className="rounded-xl" /></div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground rounded-xl">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Campanhas", value: String(adCampaigns.length), icon: <Megaphone className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Activas", value: String(activeCount), icon: <Play className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Receita Prevista", value: formatPrice(totalExpected), icon: <DollarSign className="w-4 h-4" />, color: "text-muted-foreground", bg: "bg-muted" },
          { label: "Receita Realizada", value: formatPrice(totalRealized), icon: <TrendingUp className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Impressões", value: totalImpressions.toLocaleString("pt-MZ"), icon: <Eye className="w-4 h-4" />, color: "text-muted-foreground", bg: "bg-muted" },
          { label: "CTR", value: `${globalCTR}%`, icon: <MousePointerClick className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.color} mb-2`}>{s.icon}</div>
              <p className="text-lg font-display font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by space */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" /> Receitas por Espaço</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {spaceStats.map((ss) => {
              const pct = ss.totalExpected > 0 ? Math.round((ss.totalRealized / ss.totalExpected) * 100) : 0;
              return (
                <div key={ss.space} onClick={() => setFilterSpace(filterSpace === ss.space ? "all" : ss.space)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${filterSpace === ss.space ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-display font-semibold">{ss.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{ss.activeAds} activo{ss.activeAds !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div><p className="text-xs text-muted-foreground">Realizado / Previsto</p><p className="text-sm font-bold">{formatPrice(ss.totalRealized)} <span className="text-muted-foreground font-normal">/ {formatPrice(ss.totalExpected)}</span></p></div>
                    <span className={`text-lg font-display font-bold ${pct >= 70 ? "text-primary" : pct >= 40 ? "text-accent" : "text-destructive"}`}>{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-primary" : pct >= 40 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por título ou parceiro..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as AdStatus | "all")}>
            <SelectTrigger className="rounded-xl sm:w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos estados</SelectItem>
              {(Object.entries(AD_STATUS_LABELS) as [AdStatus, string][]).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterPartner} onValueChange={setFilterPartner}>
            <SelectTrigger className="rounded-xl sm:w-[180px]"><SelectValue placeholder="Parceiro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos parceiros</SelectItem>
              {partners.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {filterSpace !== "all" && <Badge variant="outline" className="text-xs gap-1"><Monitor className="w-3 h-3" /> {AD_SPACE_LABELS[filterSpace]} <button className="ml-1 hover:text-destructive" onClick={() => setFilterSpace("all")}>×</button></Badge>}
            {filterStatus !== "all" && <Badge variant="outline" className="text-xs gap-1">{AD_STATUS_LABELS[filterStatus]} <button className="ml-1 hover:text-destructive" onClick={() => setFilterStatus("all")}>×</button></Badge>}
            {filterPartner !== "all" && <Badge variant="outline" className="text-xs gap-1">{filterPartner} <button className="ml-1 hover:text-destructive" onClick={() => setFilterPartner("all")}>×</button></Badge>}
            {searchQuery && <Badge variant="outline" className="text-xs gap-1">"{searchQuery}" <button className="ml-1 hover:text-destructive" onClick={() => setSearchQuery("")}>×</button></Badge>}
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => { setFilterSpace("all"); setFilterStatus("all"); setFilterPartner("all"); setSearchQuery(""); }}>Limpar tudo</Button>
          </div>
        )}
      </Card>

      {/* Campaigns table */}
      <Card className="overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_130px_90px_90px_80px_70px_80px] gap-3 items-center px-5 py-3 bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Campanha</span><span>Espaço</span><span>Estado</span><span className="text-right">Receita</span><span className="text-right">Impr.</span><span className="text-right">CTR</span><span className="text-center">Acções</span>
        </div>
        <div className="divide-y divide-border">
          {paginatedAds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma campanha encontrada</p>{hasFilters && <p className="text-xs mt-1">Ajuste os filtros para ver resultados</p>}</div>
          ) : paginatedAds.map((ad) => {
            const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
            const revPct = ad.expectedRevenue > 0 ? Math.round((ad.realizedRevenue / ad.expectedRevenue) * 100) : 0;
            return (
              <div key={ad.id} className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_130px_90px_90px_80px_70px_80px] gap-3 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors ${ad.status === "paused" ? "opacity-70" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={ad.image} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-border" />
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm truncate">{ad.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{ad.partner} • {ad.startDate} → {ad.endDate || "∞"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] w-fit">{AD_SPACE_LABELS[ad.space]}</Badge>
                <div className="hidden sm:block"><Badge variant={statusBadgeVariant(ad.status)} className="text-[10px]">{AD_STATUS_LABELS[ad.status]}</Badge></div>
                <div className="hidden sm:block text-right">
                  <span className="text-sm font-display font-bold">{formatPrice(ad.realizedRevenue)}</span>
                  {ad.expectedRevenue > 0 && (
                    <div className="mt-0.5">
                      <div className="h-1 bg-muted rounded-full overflow-hidden w-16 ml-auto"><div className={`h-full rounded-full ${revPct >= 70 ? "bg-primary" : revPct >= 40 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${Math.min(revPct, 100)}%` }} /></div>
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-xs text-right text-muted-foreground">{ad.impressions.toLocaleString("pt-MZ")}</span>
                <span className={`hidden sm:block text-xs text-right font-medium ${Number(ctr) >= 3 ? "text-primary" : Number(ctr) >= 1 ? "text-foreground" : "text-muted-foreground"}`}>{ctr}%</span>
                <div className="flex gap-0.5 justify-end sm:justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title={ad.status === "active" ? "Pausar" : "Activar"} onClick={() => toggleStatus(ad)}>{ad.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(ad)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(ad.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(currentPage - 1) * ADS_PER_PAGE + 1}–{Math.min(currentPage * ADS_PER_PAGE, filtered.length)} de {filtered.length} campanhas
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Anterior</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="h-8 w-8 rounded-lg p-0" onClick={() => setCurrentPage(page)}>{page}</Button>
            ))}
            <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Seguinte</Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Reports (with partner filter) ─── */
const ReportsTab = () => {
  const { orders, suppliers, adCampaigns } = useStore();
  const [reportSupplier, setReportSupplier] = useState<string>("all");
  const [reportAdPartner, setReportAdPartner] = useState<string>("all");

  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const totalProductRevenue = validOrders.reduce((s, o) => s + o.subtotal, 0);
  const totalIva = validOrders.reduce((s, o) => s + o.iva, 0);
  const totalDelivery = validOrders.reduce((s, o) => s + o.deliveryFee, 0);
  const totalAdRevenue = adCampaigns.reduce((s, a) => s + a.realizedRevenue, 0);

  const adPartners = [...new Set(adCampaigns.map((a) => a.partner))];

  const handlePartnerReport = (detailed: boolean) => {
    if (orders.length === 0) { toast.error("Sem encomendas para gerar relatório"); return; }
    const html = generatePartnerRevenueReport(orders, suppliers, detailed, reportSupplier !== "all" ? reportSupplier : undefined);
    openReport(html);
    toast.success(`Relatório ${detailed ? "detalhado" : "simplificado"} gerado`);
  };

  const handleAdReport = () => {
    if (adCampaigns.length === 0) { toast.error("Sem campanhas para gerar relatório"); return; }
    const html = generateAdRevenueReport(adCampaigns, reportAdPartner !== "all" ? reportAdPartner : undefined);
    openReport(html);
    toast.success("Relatório de publicidade gerado");
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl md:text-3xl font-display font-bold">Relatórios</h1><p className="text-sm text-muted-foreground">Gerar relatórios de receitas filtrados por beneficiário</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Produtos", value: formatPrice(totalProductRevenue), icon: <DollarSign className="w-5 h-5" />, bg: "bg-primary/10", color: "text-primary" },
          { label: "Receita Publicidade", value: formatPrice(totalAdRevenue), icon: <Megaphone className="w-5 h-5" />, bg: "bg-accent/10", color: "text-accent" },
          { label: "IVA Cobrado", value: formatPrice(totalIva), icon: <BarChart3 className="w-5 h-5" />, bg: "bg-secondary/10", color: "text-secondary" },
          { label: "Receita Entregas", value: formatPrice(totalDelivery), icon: <Truck className="w-5 h-5" />, bg: "bg-muted", color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-5"><div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div><p className="text-2xl font-display font-bold">{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Receitas (Parceiros)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground"><strong>Não inclui taxas de transporte.</strong> Seleccione o beneficiário para gerar relatório direccionado.</p>
            <div>
              <Label className="text-xs">Beneficiário</Label>
              <Select value={reportSupplier} onValueChange={setReportSupplier}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os parceiros</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handlePartnerReport(false)} variant="outline" className="rounded-xl flex-1"><Download className="w-4 h-4 mr-1.5" /> Simplificado</Button>
              <Button onClick={() => handlePartnerReport(true)} className="bg-primary text-primary-foreground rounded-xl flex-1"><Download className="w-4 h-4 mr-1.5" /> Detalhado</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-accent" /> Receitas Publicitárias</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Relatório de campanhas com receitas, impressões e cliques. Filtre por parceiro publicitário.</p>
            <div>
              <Label className="text-xs">Beneficiário</Label>
              <Select value={reportAdPartner} onValueChange={setReportAdPartner}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os parceiros</SelectItem>
                  {adPartners.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdReport} className="bg-primary text-primary-foreground rounded-xl w-full"><Download className="w-4 h-4 mr-1.5" /> Gerar Relatório</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ─── Settings (Delivery Fees + Premium) ─── */
const SettingsTab = () => {
  const { deliveryFees, setDeliveryFees, premiumSettings, setPremiumSettings } = useStore();
  const [fees, setFees] = useState({ maputo: String(deliveryFees.maputo), matola: String(deliveryFees.matola) });
  const [premium, setPremium] = useState({
    adDiscount: String(Math.round(premiumSettings.adDiscount * 100)),
    prioritySlots: String(premiumSettings.prioritySlots),
    subscriptionMonths: String(premiumSettings.subscriptionMonths),
  });

  const handleSaveFees = () => {
    setDeliveryFees({ maputo: Number(fees.maputo) || 0, matola: Number(fees.matola) || 0 });
    toast.success("Taxas de entrega actualizadas");
  };

  const handleSavePremium = () => {
    setPremiumSettings({
      adDiscount: (Number(premium.adDiscount) || 15) / 100,
      prioritySlots: Number(premium.prioritySlots) || 2,
      subscriptionMonths: Number(premium.subscriptionMonths) || 6,
    });
    toast.success("Benefícios Premium actualizados");
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl md:text-3xl font-display font-bold">Definições</h1><p className="text-sm text-muted-foreground">Configurações gerais do marketplace</p></div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Taxas de Entrega</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Defina as taxas de entrega para cada zona. Os valores serão aplicados automaticamente no checkout.</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-md">
            {(Object.entries(DELIVERY_ZONE_LABELS) as [DeliveryZone, string][]).map(([zone, label]) => (
              <div key={zone}>
                <Label>{label} (MZN)</Label>
                <Input type="number" value={fees[zone]} onChange={(e) => setFees({ ...fees, [zone]: e.target.value })} className="rounded-xl" />
              </div>
            ))}
          </div>
          <Button onClick={handleSaveFees} className="bg-primary text-primary-foreground rounded-xl"><CheckCircle className="w-4 h-4 mr-1.5" /> Guardar Taxas</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Programa Premium — Benefícios</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">Configure os benefícios do pacote Premium. As alterações serão aplicadas a todas as novas subscrições e reflectidas no marketplace.</p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-xl">
            <div>
              <Label>Desconto Publicidade (%)</Label>
              <Input type="number" min="0" max="100" value={premium.adDiscount} onChange={(e) => setPremium({ ...premium, adDiscount: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <Label>Espaços Prioritários</Label>
              <Input type="number" min="0" max="10" value={premium.prioritySlots} onChange={(e) => setPremium({ ...premium, prioritySlots: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <Label>Duração (meses)</Label>
              <Input type="number" min="1" max="24" value={premium.subscriptionMonths} onChange={(e) => setPremium({ ...premium, subscriptionMonths: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 space-y-2 text-sm text-muted-foreground">
            <p><strong>Resumo actual do pacote:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Destaque prioritário e selo Premium no marketplace</li>
              <li>{premium.prioritySlots} espaços publicitários com prioridade de inserção</li>
              <li>{premium.adDiscount}% de desconto nas taxas de publicidade</li>
              <li>Subscrição de {premium.subscriptionMonths} meses</li>
              <li>Recomendação especial DrOnline</li>
            </ul>
          </div>
          <Button onClick={handleSavePremium} className="bg-primary text-primary-foreground rounded-xl"><CheckCircle className="w-4 h-4 mr-1.5" /> Guardar Benefícios</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
