import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShoppingBag, Loader2 } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, isSupplier } = useAuth();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<"supplier" | "customer">("supplier");

  useEffect(() => {
    if (user) navigate(isSupplier ? "/fornecedor" : "/", { replace: true });
  }, [user, isSupplier, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sessão iniciada!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast.error("Indique o seu nome completo.");
    if (password.length < 6) return toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim(), account_type: accountType },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Conta criada! Confirme o seu email para entrar.");
    } else {
      toast.success("Conta criada com sucesso!");
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if ("error" in result && result.error) toast.error("Não foi possível entrar com Google.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />
      <main className="flex-1 container py-10 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-extrabold">Área de Fornecedores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registe a sua empresa e comece a vender no Dr.Online Market.
            </p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aceder à conta</CardTitle>
              <CardDescription className="text-xs">
                Fornecedores e clientes usam o mesmo acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signup">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="signup">Registar</TabsTrigger>
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                </TabsList>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { key: "supplier", label: "Fornecedor", icon: Store },
                        { key: "customer", label: "Cliente", icon: ShoppingBag },
                      ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setAccountType(key)}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors ${
                            accountType === key
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input id="name" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" value={phone} maxLength={20} placeholder="+258 ..." onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Palavra-passe</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar conta
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-in">Email</Label>
                      <Input id="email-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pass-in">Palavra-passe</Label>
                      <Input id="pass-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Entrar
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle} type="button">
                Continuar com Google
              </Button>

              <p className="text-[11px] text-muted-foreground text-center mt-4">
                Ao continuar aceita os termos do <Link to="/sobre" className="text-primary hover:underline">Dr.Online Market</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default AuthPage;
