const StoreFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xs">Dr</span>
              </div>
              <span className="font-display font-bold">DrOnline Market</span>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              O seu marketplace de saúde e bem-estar em Moçambique. Produtos verificados de fornecedores confiáveis.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Contacto</h4>
            <p className="text-sm text-secondary-foreground/70">+258 861 024 024</p>
            <p className="text-sm text-secondary-foreground/70">market@dronlinemz.com</p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Informação</h4>
            <p className="text-sm text-secondary-foreground/70">Pagamentos seguros via M-Pesa e transferência bancária</p>
            <p className="text-sm text-secondary-foreground/70 mt-1">Entrega em todo Moçambique</p>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/20 mt-8 pt-6 text-center text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} DrOnline Moçambique. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
