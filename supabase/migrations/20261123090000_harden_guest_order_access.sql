-- Bring the production Supabase migration history in line with the
-- already-reviewed Drizzle hardening migrations. The original Supabase
-- bootstrap migration left guest-visible SELECT policies on orders and items.

DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view order items" ON public.order_items;
CREATE POLICY "Admins can view order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Guest checkout can insert valid order items" ON public.order_items;
CREATE POLICY "Guest checkout can insert valid order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  quantity > 0
  AND EXISTS (
    SELECT 1
    FROM public.products AS p
    WHERE p.id = product_id
      AND p.name = product_name
      AND p.price = product_price
  )
);

DROP POLICY IF EXISTS "Customers can view their orders by email" ON public.orders;
DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
CREATE POLICY "Admins can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Guest checkout can create valid orders" ON public.orders;
CREATE POLICY "Guest checkout can create valid orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  btrim(customer_name) <> ''
  AND btrim(customer_phone) <> ''
  AND btrim(customer_address) <> ''
  AND (
    customer_email = ''
    OR customer_email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
  )
  AND subtotal >= 0
  AND iva = round(subtotal * 0.16, 2)
  AND delivery_fee >= 0
  AND total = subtotal + iva + delivery_fee
  AND (
    (payment_method = 'mpesa'::public.payment_method AND status = 'pending'::public.order_status)
    OR
    (payment_method = 'bank-transfer'::public.payment_method AND status = 'payment-submitted'::public.order_status)
  )
);
