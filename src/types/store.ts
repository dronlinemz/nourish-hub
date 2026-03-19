export interface Supplier {
  id: string;
  name: string;
  logo?: string;
  description: string;
  rating: number;
  verified: boolean;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: Category;
  supplierId: string;
  stock: number;
  featured: boolean;
  createdAt: string;
}

export type Category =
  | "alimentacao-saudavel"
  | "suplementos"
  | "primeiros-socorros"
  | "equipamento-estudante"
  | "fitness-recuperacao"
  | "ergonomia"
  | "nutricao"
  | "diagnostico";

export const CATEGORY_LABELS: Record<Category, string> = {
  "alimentacao-saudavel": "Alimentação Saudável",
  "suplementos": "Suplementos",
  "primeiros-socorros": "Primeiros Socorros",
  "equipamento-estudante": "Equipamento Estudante",
  "fitness-recuperacao": "Fitness & Recuperação",
  "ergonomia": "Ergonomia",
  "nutricao": "Nutrição",
  "diagnostico": "Ferramentas de Diagnóstico",
};

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = "mpesa" | "bank-transfer";

export type OrderStatus = "pending" | "payment-submitted" | "payment-verified" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  status: OrderStatus;
  createdAt: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  "pending": "Pendente",
  "payment-submitted": "Comprovativo Enviado",
  "payment-verified": "Pagamento Verificado",
  "shipped": "Enviado",
  "delivered": "Entregue",
  "cancelled": "Cancelado",
};
