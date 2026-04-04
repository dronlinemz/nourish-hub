import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, User, Phone, Clock } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

const StoreHeader = () => {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Loja" },
    { to: "/parceiros", label: "Parceiros" },
    { to: "/sobre", label: "Sobre" },
  ];

  return (
    <>
      {/* Top info bar - matching DrOnline style */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container flex items-center justify-between h-9 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span className="font-medium">+258 861 024 024</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Atendimento 24 horas</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-secondary-foreground/70">market@dronlinemz.com</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border/50 shadow-sm">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight text-foreground">
                Dr<span className="text-primary">.</span>Online
              </span>
              <span className="text-[9px] font-semibold text-primary leading-tight tracking-[0.2em] uppercase">
                Market
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link to="/admin" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-lg">
                <User className="w-4 h-4 mr-1.5" /> Admin
              </Button>
            </Link>
            <Link to="/carrinho" className="relative">
              <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-primary/5">
                <ShoppingCart className="w-[18px] h-[18px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full shadow-sm">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border/50 bg-card animate-fade-in">
            <nav className="container py-3 flex flex-col gap-0.5">
              {[...navLinks, { to: "/admin", label: "Admin" }].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default StoreHeader;
