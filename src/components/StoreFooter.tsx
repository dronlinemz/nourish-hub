import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

const StoreFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      {/* Main footer */}
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex flex-col mb-4">
              <span className="font-display font-extrabold text-xl leading-none">
                Dr<span className="text-primary">.</span>Online
              </span>
              <span className="text-[9px] font-bold text-primary leading-none tracking-[0.25em] uppercase mt-1">
                Market
              </span>
            </div>
            <p className="text-sm text-secondary-foreground/60 max-w-sm leading-relaxed mb-4">
              O seu marketplace de saúde e bem-estar em Moçambique. Produtos verificados de fornecedores confiáveis para uma vida mais saudável.
            </p>
            <a
              href="https://dronlinemz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Visitar dronlinemz.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-secondary-foreground/90">Links Rápidos</h4>
            <nav className="flex flex-col gap-2">
              {[
                { to: "/", label: "Loja" },
                { to: "/parceiros", label: "Parceiros" },
                { to: "/sobre", label: "Sobre Nós" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-secondary-foreground/50 hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-secondary-foreground/90">Contacto</h4>
            <div className="space-y-3">
              <a href="tel:+258861024024" className="flex items-center gap-2.5 text-sm text-secondary-foreground/50 hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <span>+258 861 024 024</span>
              </a>
              <a href="mailto:market@dronlinemz.com" className="flex items-center gap-2.5 text-sm text-secondary-foreground/50 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <span>market@dronlinemz.com</span>
              </a>
              <div className="flex items-center gap-2.5 text-sm text-secondary-foreground/50">
                <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <span>Maputo, Moçambique</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-secondary-foreground/8">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-secondary-foreground/30">
          <span>© {new Date().getFullYear()} DrOnline Moçambique. Todos os direitos reservados.</span>
          <span>Desenvolvido por ALINVEST em parceria com DERFLASH</span>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
