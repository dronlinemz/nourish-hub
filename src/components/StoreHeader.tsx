import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const StoreHeader = () => {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">Dr</span>
          </div>
          <span className="font-display font-bold text-lg text-secondary">
            DrOnline <span className="text-primary">Market</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Loja
          </Link>
          <Link to="/categorias" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Categorias
          </Link>
          <Link to="/sobre" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Sobre
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/admin" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <User className="w-4 h-4 mr-1" />
              Admin
            </Button>
          </Link>
          <Link to="/carrinho" className="relative">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-card animate-fade-in">
          <nav className="container py-4 flex flex-col gap-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Loja</Link>
            <Link to="/categorias" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Categorias</Link>
            <Link to="/sobre" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Sobre</Link>
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2">Admin</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default StoreHeader;
