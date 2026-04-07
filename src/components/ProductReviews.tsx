import { useState } from "react";
import { Star, ThumbsUp, User, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  verified: boolean;
}

// Mock reviews seeded by product id for variety
const generateReviews = (productId: string): Review[] => {
  const seed = productId.charCodeAt(productId.length - 1);
  const names = ["Ana M.", "Carlos S.", "Fernanda L.", "João P.", "Maria T.", "Ricardo N.", "Sofia A.", "Pedro G."];
  const comments = [
    "Excelente produto! Qualidade superior e entrega rápida. Recomendo a todos.",
    "Muito bom, corresponde à descrição. Embalagem cuidada e bem protegida.",
    "Produto de qualidade. Já é a segunda vez que compro e estou muito satisfeito.",
    "Bom produto pelo preço. A entrega demorou um pouco mais do que esperava, mas valeu a pena.",
    "Surpreendeu-me pela positiva. Qualidade acima do esperado para o preço.",
    "Produto conforme descrito. Chegou bem embalado e dentro do prazo.",
    "Fantástico! Uso diariamente e noto uma grande diferença. 100% recomendado.",
    "Boa relação qualidade-preço. Funciona exactamente como prometido.",
  ];

  const count = 3 + (seed % 4);
  return Array.from({ length: count }, (_, i) => ({
    id: `${productId}-rev-${i}`,
    author: names[(seed + i) % names.length],
    rating: Math.min(5, 3 + ((seed + i) % 3)),
    date: `2026-0${1 + (i % 3)}-${10 + ((seed + i * 3) % 18)}`,
    comment: comments[(seed + i) % comments.length],
    helpful: (seed * (i + 1)) % 15,
    verified: i < count - 1,
  }));
};

interface ProductReviewsProps {
  productId: string;
}

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5",
          i < rating ? "text-accent fill-accent" : "text-muted-foreground/20"
        )}
      />
    ))}
  </div>
);

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [allReviews, setAllReviews] = useState<Review[]>(() => generateReviews(productId));
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avgRating = allReviews.length ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => ({ star, count: allReviews.filter((r) => r.rating === star).length })
  );

  const displayed = showAll ? allReviews : allReviews.slice(0, 3);

  const handleSubmitReview = () => {
    const name = formName.trim();
    const comment = formComment.trim();
    if (!name || name.length > 50) { toast.error("Insira o seu nome (máx. 50 caracteres)"); return; }
    if (formRating < 1) { toast.error("Selecione uma classificação"); return; }
    if (!comment || comment.length > 500) { toast.error("Escreva um comentário (máx. 500 caracteres)"); return; }

    setSubmitting(true);
    // Simulate async
    setTimeout(() => {
      const newReview: Review = {
        id: `${productId}-rev-${Date.now()}`,
        author: name,
        rating: formRating,
        date: new Date().toISOString().split("T")[0],
        comment,
        helpful: 0,
        verified: false,
      };
      setAllReviews((prev) => [newReview, ...prev]);
      setFormName("");
      setFormRating(0);
      setFormComment("");
      setShowForm(false);
      setSubmitting(false);
      toast.success("Avaliação enviada com sucesso!");
    }, 600);
  };

  return (
    <section className="mt-12">
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm font-display font-semibold text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Avaliações dos Clientes
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-[280px_1fr] gap-6 mb-8">
        <Card className="p-6 border-border bg-card rounded-xl text-center">
          <p className="text-4xl font-display font-bold text-foreground mb-1">{avgRating.toFixed(1)}</p>
          <StarRating rating={Math.round(avgRating)} size="md" />
          <p className="text-xs text-muted-foreground mt-2">{allReviews.length} avaliações</p>
        </Card>

        <div className="flex flex-col justify-center gap-2">
          {ratingCounts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12 text-right">{star} estrela{star > 1 ? "s" : ""}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {displayed.map((review) => (
          <Card key={review.id} className="p-5 border-border bg-card rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{review.author}</span>
                    {review.verified && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Compra verificada</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString("pt-MZ", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.comment}</p>
            <button
              onClick={() => setHelpfulClicked((prev) => ({ ...prev, [review.id]: true }))}
              disabled={helpfulClicked[review.id]}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs transition-colors",
                helpfulClicked[review.id] ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Útil ({review.helpful + (helpfulClicked[review.id] ? 1 : 0)})
            </button>
          </Card>
        ))}
      </div>

      {reviews.length > 3 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="rounded-xl border-border"
          >
            {showAll ? "Mostrar menos" : `Ver todas as ${allReviews.length} avaliações`}
          </Button>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
