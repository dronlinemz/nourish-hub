import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, User, Phone, Clock } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

const StoreHeader = () => {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Loja" },
    { to: "/parceiros", label: "Parceiros" },
    { to: "/sobre", label: "Sobre" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top info bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container flex items-center justify-between h-8 text-[11px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 opacity-70" />
              <span className="font-medium">+258 861 024 024</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 opacity-70">
              <Clock className="w-3 h-3" />
              <span>Atendimento 24 horas</span>
            </div>
          </div>
          <span className="hidden sm:inline text-secondary-foreground/60">market@dronlinemz.com</span>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/40 shadow-sm">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg leading-none text-foreground tracking-tight">
                Dr<span className="text-primary">.</span>Online
              </span>
              <span className="text-[8px] font-bold text-primary leading-none tracking-[0.25em] uppercase mt-0.5">
                Market
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.to)
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link to="/admin" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-lg h-9 text-xs">
                <User className="w-3.5 h-3.5 mr-1.5" /> Admin
              </Button>
            </Link>
            <Link to="/carrinho" className="relative">
              <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-primary/5 h-9 w-9">
                <ShoppingCart className="w-[17px] h-[17px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full shadow-sm leading-none">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border/40 bg-card animate-fade-in">
            <nav className="container py-2 flex flex-col gap-0.5">
              {[...navLinks, { to: "/admin", label: "Admin" }].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                    isActive(link.to) ? "text-primary bg-primary/5" : "hover:bg-muted/50 hover:text-primary"
                  }`}
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
