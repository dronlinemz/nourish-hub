import { Shield, Truck, CreditCard, Heart, Users, Target, Sparkles, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import PartnerBanner from "@/components/PartnerBanner";
import { useStore } from "@/contexts/StoreContext";

const AboutPage = () => {
  const { suppliers, products } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground py-14 md:py-20">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-3">Sobre o DrOnline Market</h1>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Somos o marketplace de referência em Moçambique para produtos de saúde, bem-estar e equipamentos médicos acessíveis.
          </p>
        </div>
      </section>

      <main className="container flex-1 py-10">
        {/* Mission */}
        <section className="max-w-3xl mx-auto text-center mb-16">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">A Nossa Missão</h2>
          <p className="text-muted-foreground leading-relaxed">
            Democratizar o acesso a produtos de saúde e bem-estar em Moçambique, conectando fornecedores verificados 
            a consumidores que procuram qualidade, segurança e preços justos. Acreditamos que saúde e bem-estar 
            devem estar ao alcance de todos.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-xl font-display font-bold text-center mb-8">Os Nossos Valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "Qualidade Verificada", desc: "Todos os fornecedores são verificados e certificados para garantir produtos seguros." },
              { icon: <Heart className="w-6 h-6" />, title: "Saúde em Primeiro", desc: "Priorizamos o bem-estar dos nossos clientes em cada decisão que tomamos." },
              { icon: <Users className="w-6 h-6" />, title: "Comunidade", desc: "Apoiamos fornecedores locais e contribuímos para a economia moçambicana." },
              { icon: <Sparkles className="w-6 h-6" />, title: "Inovação", desc: "Trazemos as melhores soluções de saúde e tecnologia para o mercado." },
            ].map((item) => (
              <Card key={item.title} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-display font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <PartnerBanner variant="wide" className="mb-16" />

        {/* Stats */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12">
            <h2 className="text-xl font-display font-bold text-center mb-8">O DrOnline Market em Números</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: products.length + "+", label: "Produtos Disponíveis" },
                { value: suppliers.length, label: "Fornecedores Verificados" },
                { value: "8", label: "Categorias" },
                { value: "🇲🇿", label: "Feito em Moçambique" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl md:text-4xl font-display font-extrabold text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mb-16">
          <h2 className="text-xl font-display font-bold text-center mb-8">Porquê Escolher-nos?</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: <BadgeCheck className="w-5 h-5 text-primary" />, title: "Produtos Verificados", desc: "Cada produto passa por um processo de verificação rigoroso antes de ser publicado." },
              { icon: <Truck className="w-5 h-5 text-primary" />, title: "Entrega Nacional", desc: "Entregamos em todo o território moçambicano com rastreamento em tempo real." },
              { icon: <CreditCard className="w-5 h-5 text-primary" />, title: "Pagamento Seguro", desc: "Aceite M-Pesa e transferência bancária com verificação de comprovativos." },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section>
          <h2 className="text-xl font-display font-bold text-center mb-8">Os Nossos Fornecedores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suppliers.map((s) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3 text-secondary font-display font-bold text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <h3 className="font-display font-bold text-sm mb-1">{s.name}</h3>
                  {s.verified && (
                    <span className="badge-verified text-[10px] mb-2">
                      <BadgeCheck className="w-3 h-3" /> Verificado
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
};

export default AboutPage;
