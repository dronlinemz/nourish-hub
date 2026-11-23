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
    OR customer_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
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