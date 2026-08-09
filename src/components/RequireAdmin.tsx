import { Link, Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores da plataforma.
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/"><Button variant="outline" size="sm">Voltar à loja</Button></Link>
            <Link to="/fornecedor"><Button size="sm">Área de fornecedor</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
