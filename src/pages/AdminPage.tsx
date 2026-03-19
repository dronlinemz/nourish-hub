import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingBag, ArrowLeft, Plus, Pencil, Trash2,
  BadgeCheck, Eye, CheckCircle, XCircle, Truck, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/contexts/StoreContext";
import { CATEGORY_LABELS, ORDER_STATUS_LABELS } from "@/types/store";
import type { Product, Supplier, Category, Order, OrderStatus } from "@/types/store";
import { toast } from "sonner";

type Tab = "dashboard" | "products" | "suppliers" | "orders";

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Painel", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "products", label: "Produtos", icon: <Package className="w-4 h-4" /> },
    { id: "suppliers", label: "Fornecedores", icon: <Users className="w-4 h-4" /> },
    { id: "orders", label: "Encomendas", icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-display font-bold text-xs">Dr</span>
            </div>
            <span className="font-display font-bold text-sm">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à Loja
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar z-50 border-t border-sidebar-border flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs ${
              tab === t.id ? "text-sidebar-primary" : "text-sidebar-foreground/60"
            }`}
          >
            {t.icon}
            <span className="mt-1">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto pb-20 md:pb-8">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "suppliers" && <SuppliersTab />}
        {tab === "orders" && <OrdersTab />}
      </main>
    </div>
  );
};

const DashboardTab = () => {
  const { products, suppliers, orders } = useStore();
  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const formatPrice = (p: number) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(p);

  const stats = [
    { label: "Produtos", value: products.length, icon: <Package className="w-5 h-5" /> },
    { label: "Fornecedores", value: suppliers.length, icon: <Users className="w-5 h-5" /> },
    { label: "Encomendas", value: orders.length, icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "Receita", value: formatPrice(totalRevenue), icon: <Star className="w-5 h-5" /> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Painel de Controlo</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {s.icon}
              <span className="text-sm">{s.label}</span>
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h2 className="font-display font-bold mb-4">Encomendas Recentes</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma encomenda ainda</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.customerName} • {new Date(o.createdAt).toLocaleDateString("pt-MZ")}</p>
                </div>
                <Badge variant={o.status === "payment-verified" ? "default" : "secondary"}>
                  {ORDER_STATUS_LABELS[o.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const ProductsTab = () => {
  const { products, suppliers, setProducts } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", originalPrice: "", image: "", category: "" as Category | "",
    supplierId: "", stock: "", featured: false,
  });

  const formatPrice = (p: number) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(p);

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
    if (!form.name || !form.price || !form.category || !form.supplierId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const data: Product = {
      id: editProduct?.id || `prod-${Date.now()}`,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      image: form.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
      category: form.category as Category,
      supplierId: form.supplierId,
      stock: Number(form.stock) || 0,
      featured: form.featured,
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

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Produto removido");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Produtos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Preço (MZN) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Preço Original</Label><Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} /></div>
              </div>
              <div><Label>URL da Imagem</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor *</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm">Destaque</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {products.map((p) => {
          const supplier = suppliers.find((s) => s.id === p.supplierId);
          return (
            <Card key={p.id} className="flex items-center gap-4 p-4">
              <img src={p.image} alt={p.name} className="w-14 h-14 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{supplier?.name} • {CATEGORY_LABELS[p.category]}</p>
              </div>
              <span className="font-display font-bold text-sm hidden sm:block">{formatPrice(p.price)}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">{p.stock} un.</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const SuppliersTab = () => {
  const { suppliers, setSuppliers } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", contactEmail: "", contactPhone: "", rating: "5", verified: true,
  });

  const openNew = () => {
    setEditSupplier(null);
    setForm({ name: "", description: "", contactEmail: "", contactPhone: "", rating: "5", verified: true });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setForm({
      name: s.name, description: s.description, contactEmail: s.contactEmail,
      contactPhone: s.contactPhone, rating: String(s.rating), verified: s.verified,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.contactEmail) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const data: Supplier = {
      id: editSupplier?.id || `sup-${Date.now()}`,
      name: form.name, description: form.description, contactEmail: form.contactEmail,
      contactPhone: form.contactPhone, rating: Number(form.rating), verified: form.verified,
      createdAt: editSupplier?.createdAt || new Date().toISOString(),
    };
    if (editSupplier) {
      setSuppliers((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      toast.success("Fornecedor actualizado");
    } else {
      setSuppliers((prev) => [...prev, data]);
      toast.success("Fornecedor adicionado");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast.success("Fornecedor removido");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Fornecedores</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email *</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm">Verificado</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold">{s.name}</h3>
                  {s.verified && <span className="badge-verified"><BadgeCheck className="w-3 h-3" /> Verificado</span>}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-sm">{s.rating}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
            <p className="text-xs text-muted-foreground">{s.contactEmail} • {s.contactPhone}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const OrdersTab = () => {
  const { orders, updateOrderStatus } = useStore();
  const formatPrice = (p: number) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(p);

  const statusActions: Record<string, { next: OrderStatus; label: string; icon: React.ReactNode }[]> = {
    "pending": [{ next: "cancelled", label: "Cancelar", icon: <XCircle className="w-3.5 h-3.5" /> }],
    "payment-submitted": [
      { next: "payment-verified", label: "Verificar", icon: <CheckCircle className="w-3.5 h-3.5" /> },
      { next: "cancelled", label: "Cancelar", icon: <XCircle className="w-3.5 h-3.5" /> },
    ],
    "payment-verified": [{ next: "shipped", label: "Enviar", icon: <Truck className="w-3.5 h-3.5" /> }],
    "shipped": [{ next: "delivered", label: "Entregue", icon: <CheckCircle className="w-3.5 h-3.5" /> }],
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Encomendas</h1>
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma encomenda registada</Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-display font-bold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customerName} • {o.customerPhone} • {new Date(o.createdAt).toLocaleDateString("pt-MZ")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={o.status === "cancelled" ? "destructive" : o.status === "delivered" ? "default" : "secondary"}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                  <p className="font-display font-bold text-sm mt-1">{formatPrice(o.total)}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-3">
                <p>Pagamento: {o.paymentMethod === "mpesa" ? "M-Pesa" : "Transferência Bancária"}</p>
                {o.paymentProofUrl && (
                  <a href={o.paymentProofUrl} target="_blank" rel="noreferrer" className="text-primary underline text-xs">
                    Ver comprovativo
                  </a>
                )}
                <p className="mt-1">Endereço: {o.customerAddress}</p>
              </div>

              <Separator className="my-3" />

              <div className="space-y-1 mb-3">
                {o.items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {statusActions[o.status] && (
                <div className="flex gap-2">
                  {statusActions[o.status].map((action) => (
                    <Button
                      key={action.next}
                      variant={action.next === "cancelled" ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        updateOrderStatus(o.id, action.next);
                        toast.success(`Estado alterado para: ${ORDER_STATUS_LABELS[action.next]}`);
                      }}
                      className={action.next !== "cancelled" ? "bg-primary text-primary-foreground" : ""}
                    >
                      {action.icon}
                      <span className="ml-1">{action.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
