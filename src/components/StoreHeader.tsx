import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, User, Heart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const StoreHeader = () => {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-header">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            <span className="text-primary-foreground font-display font-extrabold text-sm">Dr</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base leading-tight text-foreground">
              DrOnline
            </span>
            <span className="text-[10px] font-medium text-primary leading-tight tracking-wider uppercase">
              Market
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { to: "/", label: "Loja" },
            { to: "/categorias", label: "Categorias" },
            { to: "/sobre", label: "Sobre" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link to="/admin" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-lg">
              <User className="w-4 h-4 mr-1.5" />
              Admin
            </Button>
          </Link>
          <Link to="/carrinho" className="relative">
            <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-muted/60">
              <ShoppingCart className="w-[18px] h-[18px]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full shadow-sm">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <button className="md:hidden p-2 rounded-lg hover:bg-muted/60 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-3 flex flex-col gap-0.5">
            {[
              { to: "/", label: "Loja" },
              { to: "/categorias", label: "Categorias" },
              { to: "/sobre", label: "Sobre" },
              { to: "/admin", label: "Admin" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-muted/60 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default StoreHeader;
