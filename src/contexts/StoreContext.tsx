import React, { createContext, useContext, useState } from "react";
import type { Product, Supplier, Order, AdCampaign, DeliveryZone, PremiumSettings } from "@/types/store";
import { MOCK_SUPPLIERS, MOCK_PRODUCTS } from "@/data/mockData";
import { DELIVERY_FEES as DEFAULT_DELIVERY_FEES } from "@/types/store";

const DEFAULT_PREMIUM_SETTINGS: PremiumSettings = {
  adDiscount: 0.15,
  prioritySlots: 2,
  subscriptionMonths: 6,
};

const MOCK_ADS: AdCampaign[] = [
  {
    id: "ad-1", partner: "NutriVida Moçambique", title: "20% de desconto em suplementos",
    description: "Use o código NUTRI20 na sua próxima compra", cta: "Ver Ofertas", url: "#",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=200&fit=crop",
    space: "hero", status: "active", startDate: "2026-03-01", endDate: "2026-04-30",
    expectedRevenue: 15000, realizedRevenue: 8500, impressions: 12400, clicks: 340, createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ad-2", partner: "MedSupply Africa", title: "Kits de Primeiros Socorros",
    description: "Proteja a sua família com equipamento certificado", cta: "Comprar Agora", url: "#",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=200&fit=crop",
    space: "hero", status: "active", startDate: "2026-03-01", endDate: "2026-05-31",
    expectedRevenue: 20000, realizedRevenue: 12000, impressions: 18200, clicks: 520, createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ad-3", partner: "Orgânico do Campo", title: "Produtos frescos e orgânicos",
    description: "Directamente dos produtores locais para a sua mesa", cta: "Explorar", url: "#",
    image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&h=200&fit=crop",
    space: "catalog-wide", status: "active", startDate: "2026-02-15", endDate: "2026-04-15",
    expectedRevenue: 10000, realizedRevenue: 6200, impressions: 8900, clicks: 210, createdAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "ad-4", partner: "NutriVida Moçambique", title: "Vitaminas para toda a família",
    description: "Suplementos com qualidade certificada", cta: "Descobrir", url: "#",
    image: "https://images.unsplash.com/photo-1505576399279-0d06b1483b8e?w=800&h=200&fit=crop",
    space: "product-detail", status: "paused", startDate: "2026-03-10", endDate: "2026-06-10",
    expectedRevenue: 8000, realizedRevenue: 1200, impressions: 3200, clicks: 85, createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "ad-5", partner: "DrOnline Market", title: "Proteína Whey Isolada 1kg",
    description: "Produto em destaque", cta: "Ver", url: "prod-1",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c1cf?w=400&h=400&fit=crop",
    space: "featured", status: "active", startDate: "2026-03-01", endDate: "2026-12-31",
    expectedRevenue: 0, realizedRevenue: 0, impressions: 0, clicks: 0, createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ad-6", partner: "DrOnline Market", title: "Kit Primeiros Socorros Completo",
    description: "Produto em destaque", cta: "Ver", url: "prod-2",
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop",
    space: "featured", status: "active", startDate: "2026-03-01", endDate: "2026-12-31",
    expectedRevenue: 0, realizedRevenue: 0, impressions: 0, clicks: 0, createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ad-7", partner: "DrOnline Market", title: "Granola Orgânica com Frutos Secos",
    description: "Produto em destaque", cta: "Ver", url: "prod-4",
    image: "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=400&fit=crop",
    space: "featured", status: "active", startDate: "2026-03-01", endDate: "2026-12-31",
    expectedRevenue: 0, realizedRevenue: 0, impressions: 0, clicks: 0, createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ad-8", partner: "DrOnline Market", title: "Multivitamínico Completo",
    description: "Produto em destaque", cta: "Ver", url: "prod-7",
    image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop",
    space: "featured", status: "active", startDate: "2026-03-01", endDate: "2026-12-31",
    expectedRevenue: 0, realizedRevenue: 0, impressions: 0, clicks: 0, createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ad-9", partner: "DrOnline Market", title: "Balança Digital Inteligente",
    description: "Produto em destaque", cta: "Ver", url: "prod-10",
    image: "https://images.unsplash.com/photo-1523676060187-f55189cb4e28?w=400&h=400&fit=crop",
    space: "featured", status: "active", startDate: "2026-03-01", endDate: "2026-12-31",
    expectedRevenue: 0, realizedRevenue: 0, impressions: 0, clicks: 0, createdAt: "2026-03-01T00:00:00Z",
  },
];

interface StoreContextType {
  products: Product[];
  suppliers: Supplier[];
  orders: Order[];
  adCampaigns: AdCampaign[];
  deliveryFees: Record<DeliveryZone, number>;
  premiumSettings: PremiumSettings;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setAdCampaigns: React.Dispatch<React.SetStateAction<AdCampaign[]>>;
  setDeliveryFees: React.Dispatch<React.SetStateAction<Record<DeliveryZone, number>>>;
  setPremiumSettings: React.Dispatch<React.SetStateAction<PremiumSettings>>;
  getSupplier: (id: string) => Supplier | undefined;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(MOCK_ADS);
  const [deliveryFees, setDeliveryFees] = useState<Record<DeliveryZone, number>>(DEFAULT_DELIVERY_FEES);
  const [premiumSettings, setPremiumSettings] = useState<PremiumSettings>(DEFAULT_PREMIUM_SETTINGS);

  const getSupplier = (id: string) => suppliers.find((s) => s.id === id);
  const addOrder = (order: Order) => setOrders((prev) => [order, ...prev]);
  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  return (
    <StoreContext.Provider
      value={{ products, suppliers, orders, adCampaigns, deliveryFees, premiumSettings, setProducts, setSuppliers, setOrders, setAdCampaigns, setDeliveryFees, setPremiumSettings, getSupplier, addOrder, updateOrderStatus }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
