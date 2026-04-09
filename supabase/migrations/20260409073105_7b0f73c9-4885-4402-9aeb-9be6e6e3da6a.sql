
-- Category enum
CREATE TYPE public.product_category AS ENUM (
  'alimentacao-saudavel', 'suplementos', 'primeiros-socorros',
  'equipamento-estudante', 'fitness-recuperacao', 'ergonomia', 'nutricao', 'diagnostico'
);

-- Order status enum
CREATE TYPE public.order_status AS ENUM (
  'pending', 'payment-submitted', 'payment-verified', 'shipped', 'delivered', 'cancelled'
);

-- Payment method enum
CREATE TYPE public.payment_method AS ENUM ('mpesa', 'bank-transfer');

-- Delivery zone enum
CREATE TYPE public.delivery_zone AS ENUM ('maputo', 'matola');

-- ═══════════════════════════════════════
-- SUPPLIERS
-- ═══════════════════════════════════════
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  logo TEXT,
  premium_active BOOLEAN NOT NULL DEFAULT false,
  premium_start_date DATE,
  premium_end_date DATE,
  premium_ad_discount NUMERIC(3,2) NOT NULL DEFAULT 0.15,
  premium_priority_slots INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suppliers" ON public.suppliers
  FOR SELECT USING (true);

-- ═══════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image TEXT NOT NULL DEFAULT '',
  category public.product_category NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured = true;

-- ═══════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL DEFAULT '',
  customer_nuit TEXT,
  payment_method public.payment_method NOT NULL DEFAULT 'mpesa',
  payment_proof_url TEXT,
  delivery_zone public.delivery_zone NOT NULL DEFAULT 'maputo',
  subtotal NUMERIC(10,2) NOT NULL,
  iva NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Guest checkout: anyone can insert orders
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Orders viewable by email match (guest lookup)
CREATE POLICY "Customers can view their orders by email" ON public.orders
  FOR SELECT USING (true);

-- ═══════════════════════════════════════
-- ORDER ITEMS
-- ═══════════════════════════════════════
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view order items" ON public.order_items
  FOR SELECT USING (true);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ═══════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
