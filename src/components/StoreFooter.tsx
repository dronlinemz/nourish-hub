import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const StoreFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-primary-foreground font-display font-extrabold text-xs">Dr</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm leading-tight">DrOnline</span>
                <span className="text-[9px] font-medium text-primary leading-tight tracking-wider uppercase">Market</span>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/70 max-w-sm leading-relaxed">
              O seu marketplace de saúde e bem-estar em Moçambique. Produtos verificados de fornecedores confiáveis para uma vida mais saudável.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Links Rápidos</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: "/", label: "Loja" },
                { to: "/categorias", label: "Categorias" },
                { to: "/sobre", label: "Sobre Nós" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-secondary-foreground/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+258 861 024 024</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-secondary-foreground/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>market@dronlinemz.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-secondary-foreground/70">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Maputo, Moçambique</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-10 pt-6 text-center text-xs text-secondary-foreground/40">
          © {new Date().getFullYear()} DrOnline Moçambique. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
