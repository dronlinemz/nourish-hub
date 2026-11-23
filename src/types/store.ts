export interface PremiumSubscription {
  active: boolean;
  startDate: string;
  endDate: string;
  adDiscount: number; // 0.15 = 15%
  prioritySlots: number; // 2 slides
}

export interface Supplier {
  id: string;
  name: string;
  logo?: string;
  description: string;
  location: string;
  rating: number;
  verified: boolean;
  contactEmail: string;
  contactPhone: string;
  premium?: PremiumSubscription;
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

export type DeliveryZone = "maputo" | "matola";

export const DELIVERY_FEES: Record<DeliveryZone, number> = {
  maputo: 150,
  matola: 250,
};

export const DELIVERY_ZONE_LABELS: Record<DeliveryZone, string> = {
  maputo: "Maputo",
  matola: "Matola",
};

export const IVA_RATE = 0.16;
export const calculateIva = (subtotal: number) =>
  Math.round((subtotal * IVA_RATE + Number.EPSILON) * 100) / 100;

export type OrderStatus = "pending" | "payment-submitted" | "payment-verified" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  deliveryFee: number;
  deliveryZone: DeliveryZone;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerNuit?: string;
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

/* ─── Advertising ─── */

export type AdSpace = "hero" | "catalog-wide" | "catalog-sidebar" | "product-detail" | "cart-sidebar" | "featured";

export const AD_SPACE_LABELS: Record<AdSpace, string> = {
  "hero": "Hero (Banner Principal)",
  "catalog-wide": "Catálogo (Wide)",
  "catalog-sidebar": "Catálogo (Sidebar)",
  "product-detail": "Detalhe Produto",
  "cart-sidebar": "Carrinho (Sidebar)",
  "featured": "Destaques (Produtos)",
};

export interface PremiumSettings {
  adDiscount: number;       // e.g. 0.15 = 15%
  prioritySlots: number;    // e.g. 2
  subscriptionMonths: number; // e.g. 6
}

export type AdStatus = "active" | "paused" | "scheduled" | "ended";

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  "active": "Activo",
  "paused": "Pausado",
  "scheduled": "Agendado",
  "ended": "Terminado",
};

export interface AdCampaign {
  id: string;
  partner: string;
  partnerLogo?: string;
  title: string;
  description: string;
  cta: string;
  url: string;
  image: string;
  space: AdSpace;
  status: AdStatus;
  startDate: string;
  endDate: string;
  expectedRevenue: number;
  realizedRevenue: number;
  impressions: number;
  clicks: number;
  createdAt: string;
}
