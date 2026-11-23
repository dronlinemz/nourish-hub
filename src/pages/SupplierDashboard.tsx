import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BadgeCheck, Loader2, LogOut, Pencil, Plus, Trash2, Store } from "lucide-react";
import { CATEGORY_LABELS, type Category, type Product } from "@/types/store";
import {
  useMySupplier, useSaveSupplier, useSupplierProducts, useSaveProduct, useDeleteProduct,
} from "@/hooks/useSupplierAccount";

const emptyProduct = {
  name: "", description: "", price: "", originalPrice: "", image: "",
  category: "suplementos" as Category, stock: "0",
};

const SupplierDashboard = () => {
  const { user, loading: authLoading, isSupplier, isAdmin, signOut } = useAuth();
  const { data: supplier, isLoading: loadingSupplier } = useMySupplier(user?.id);
  const saveSupplier = useSaveSupplier(user?.id);
  const { data: products } = useSupplierProducts(supplier?.id);
  const saveProduct = useSaveProduct(supplier?.id);
  const deleteProduct = useDeleteProduct();

  const [form, setForm] = useState({
    name: "", description: "", location: "", contactEmail: "", contactPhone: "", logo: "",
  });
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name,
        description: supplier.description,
        location: supplier.location,
        contactEmail: supplier.contactEmail,
        contactPhone: supplier.contactPhone,
        logo: supplier.logo ?? "",
      });
    }
  }, [supplier]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isSupplier && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-xl font-bold">Área exclusiva de fornecedores</h1>
          <p className="text-sm text-muted-foreground mt-2">
            A sua conta não tem perfil de fornecedor associado.
          </p>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Indique o nome da empresa.");
    try {
      await saveSupplier.mutateAsync({
        id: supplier?.id,
        values: {
          name: form.name.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          logo: form.logo.trim(),
        },
      });
      toast.success(supplier ? "Perfil actualizado." : "Perfil de fornecedor criado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar.");
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name, description: p.description, price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      image: p.image, category: p.category, stock: String(p.stock),
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(productForm.price);
    if (!productForm.name.trim() || !Number.isFinite(price) || price <= 0) {
      return toast.error("Nome e preço válidos são obrigatórios.");
    }
    try {
      await saveProduct.mutateAsync({
        id: editingId,
        values: {
          name: productForm.name.trim(),
          description: productForm.description.trim(),
          price,
          originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
          image: productForm.image.trim(),
          category: productForm.category,
          stock: Number(productForm.stock) || 0,
        },
      });
      toast.success(editingId ? "Produto actualizado." : "Produto adicionado!");
      setProductForm(emptyProduct);
      setEditingId(undefined);
      setShowProductForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar produto.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />
      <main className="flex-1 container py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> Painel do Fornecedor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sair
          </Button>
        </div>

        <Tabs defaultValue="perfil">
          <TabsList className="mb-4">
            <TabsTrigger value="perfil">Perfil da empresa</TabsTrigger>
            <TabsTrigger value="produtos" disabled={!supplier}>Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <Card className="max-w-2xl">
              {supplier?.approved === false && (
                <div className="mx-6 mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
                  O perfil está em análise. Os seus produtos permanecem privados até à aprovação da equipa Nourish Hub.
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Dados do fornecedor
                  {supplier?.approved === false && <Badge variant="secondary" className="text-[10px]">A aguardar aprovação</Badge>}
                  {supplier?.verified && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <BadgeCheck className="w-3 h-3" /> Verificado
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Estes dados aparecem na página de parceiros e nas fichas dos produtos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSupplier ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <form onSubmit={handleSaveSupplier} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Nome da empresa</Label>
                      <Input value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Descrição</Label>
                      <Textarea value={form.description} maxLength={500} rows={3} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Localização</Label>
                        <Input value={form.location} maxLength={120} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Telefone</Label>
                        <Input value={form.contactPhone} maxLength={30} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email de contacto</Label>
                        <Input type="email" value={form.contactEmail} maxLength={255} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>URL do logótipo</Label>
                        <Input value={form.logo} maxLength={500} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" disabled={saveSupplier.isPending}>
                      {saveSupplier.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {supplier ? "Guardar alterações" : "Criar perfil de fornecedor"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {products?.length ?? 0} produto(s) publicados
              </p>
              <Button size="sm" onClick={() => { setEditingId(undefined); setProductForm(emptyProduct); setShowProductForm((v) => !v); }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo produto
              </Button>
            </div>

            {showProductForm && (
              <Card className="mb-6 max-w-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{editingId ? "Editar produto" : "Novo produto"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProduct} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Nome</Label>
                      <Input value={productForm.name} maxLength={150} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Descrição</Label>
                      <Textarea value={productForm.description} maxLength={800} rows={3} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Preço (MZN)</Label>
                        <Input type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Preço original</Label>
                        <Input type="number" min="0" step="0.01" value={productForm.originalPrice} onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Stock</Label>
                        <Input type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Categoria</Label>
                        <Select value={productForm.category} onValueChange={(v) => setProductForm({ ...productForm, category: v as Category })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>URL da imagem</Label>
                        <Input value={productForm.image} maxLength={500} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saveProduct.isPending}>
                        {saveProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { setShowProductForm(false); setEditingId(undefined); }}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-3">
              {(products ?? []).map((p) => (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <img src={p.image} alt={p.name} className="w-14 h-14 rounded-md object-cover bg-muted" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[p.category]} · {p.price.toLocaleString("pt-MZ")} MZN · Stock {p.stock}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(p)} aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" aria-label="Remover"
                    onClick={async () => {
                      try {
                        await deleteProduct.mutateAsync(p.id);
                        toast.success("Produto removido.");
                      } catch {
                        toast.error("Não foi possível remover.");
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </Card>
              ))}
              {products?.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Ainda não publicou produtos.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <StoreFooter />
    </div>
  );
};

export default SupplierDashboard;
