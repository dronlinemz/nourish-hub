-- Atomic guest checkout: validate catalogue prices, totals and stock on the
-- database, then create the order, its lines and stock movements in one txn.
CREATE OR REPLACE FUNCTION public.create_guest_order(p_order jsonb, p_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(10,2) := 0;
  v_iva numeric(10,2);
  v_delivery_fee numeric(10,2);
  v_expected_status public.order_status;
  v_payment_method public.payment_method;
  v_delivery_zone public.delivery_zone;
  v_customer_name text;
  v_customer_email text;
  v_customer_phone text;
  v_customer_address text;
BEGIN
  IF jsonb_typeof(p_order) <> 'object'
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Dados da encomenda inválidos.' USING ERRCODE = '22023';
  END IF;

  v_customer_name := btrim(coalesce(p_order->>'customer_name', ''));
  v_customer_email := btrim(coalesce(p_order->>'customer_email', ''));
  v_customer_phone := btrim(coalesce(p_order->>'customer_phone', ''));
  v_customer_address := btrim(coalesce(p_order->>'customer_address', ''));

  IF v_customer_name = '' OR v_customer_phone = '' OR v_customer_address = '' THEN
    RAISE EXCEPTION 'Nome, telefone e endereço são obrigatórios.' USING ERRCODE = '22023';
  END IF;
  IF v_customer_email <> '' AND v_customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Endereço de email inválido.' USING ERRCODE = '22023';
  END IF;

  v_payment_method := (p_order->>'payment_method')::public.payment_method;
  v_delivery_zone := (p_order->>'delivery_zone')::public.delivery_zone;
  v_expected_status := CASE
    WHEN v_payment_method = 'mpesa' THEN 'pending'::public.order_status
    ELSE 'payment-submitted'::public.order_status
  END;
  v_delivery_fee := CASE v_delivery_zone
    WHEN 'maputo' THEN 150.00
    WHEN 'matola' THEN 250.00
  END;

  IF v_delivery_fee IS NULL
     OR (p_order->>'delivery_fee')::numeric <> v_delivery_fee
     OR (p_order->>'status')::public.order_status <> v_expected_status THEN
    RAISE EXCEPTION 'Método de pagamento, estado ou taxa de entrega inválidos.' USING ERRCODE = '22023';
  END IF;

  IF v_payment_method = 'bank-transfer'
     AND coalesce(p_order->>'payment_proof_url', '') !~ '^proofs/[0-9a-fA-F-]{36}\\.(pdf|png|jpe?g|webp)

  -- Reject duplicate product lines to prevent stock-check bypass.
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS x(value)
    GROUP BY (x.value->>'product_id')
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'O carrinho contém produtos repetidos.' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    IF v_quantity IS NULL OR v_quantity < 1 THEN
      RAISE EXCEPTION 'Quantidade de produto inválida.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Um dos produtos já não está disponível.' USING ERRCODE = 'P0002';
    END IF;
    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para o produto: %.', v_product.name USING ERRCODE = 'P0001';
    END IF;

    v_subtotal := v_subtotal + round(v_product.price * v_quantity, 2);
  END LOOP;

  v_iva := round(v_subtotal * 0.16, 2);
  IF (p_order->>'subtotal')::numeric <> v_subtotal
     OR (p_order->>'iva')::numeric <> v_iva
     OR (p_order->>'total')::numeric <> v_subtotal + v_iva + v_delivery_fee THEN
    RAISE EXCEPTION 'Os valores do carrinho foram alterados. Actualize o carrinho e tente novamente.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.orders (
    id, customer_name, customer_email, customer_phone, customer_address,
    customer_nuit, payment_method, payment_proof_url, delivery_zone,
    subtotal, iva, delivery_fee, total, status
  ) VALUES (
    v_order_id, v_customer_name, v_customer_email, v_customer_phone, v_customer_address,
    nullif(btrim(coalesce(p_order->>'customer_nuit', '')), ''),
    v_payment_method, nullif(p_order->>'payment_proof_url', ''), v_delivery_zone,
    v_subtotal, v_iva, v_delivery_fee, v_subtotal + v_iva + v_delivery_fee, v_expected_status
  );

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order_id, p.id, p.name, p.price, v_quantity
    FROM public.products AS p
    WHERE p.id = v_product_id;

    UPDATE public.products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(jsonb, jsonb) TO anon, authenticated;

-- Private bucket for bank-transfer evidence. Guests may upload, but only
-- administrators may read or delete submitted evidence.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nourish-payment-proofs',
  'nourish-payment-proofs',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Guests can upload payment proofs" ON storage.objects;
CREATE POLICY "Guests can upload payment proofs"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'nourish-payment-proofs'
  AND (storage.foldername(name))[1] = 'proofs'
  AND name ~ '^proofs/[0-9a-fA-F-]{36}\.(pdf|png|jpe?g|webp)$'
);

DROP POLICY IF EXISTS "Admins can view payment proofs" ON storage.objects;
CREATE POLICY "Admins can view payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'nourish-payment-proofs'
  AND public.has_role((select auth.uid()), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'nourish-payment-proofs'
  AND public.has_role((select auth.uid()), 'admin'::public.app_role)
);
 THEN
    RAISE EXCEPTION 'Comprovativo de pagamento inválido.' USING ERRCODE = '22023';
  END IF;
  IF v_payment_method = 'mpesa' AND nullif(p_order->>'payment_proof_url', '') IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido anexar comprovativo a este método de pagamento.' USING ERRCODE = '22023';
  END IF;

  -- Reject duplicate product lines to prevent stock-check bypass.
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS x(value)
    GROUP BY (x.value->>'product_id')
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'O carrinho contém produtos repetidos.' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    IF v_quantity IS NULL OR v_quantity < 1 THEN
      RAISE EXCEPTION 'Quantidade de produto inválida.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Um dos produtos já não está disponível.' USING ERRCODE = 'P0002';
    END IF;
    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para o produto: %.', v_product.name USING ERRCODE = 'P0001';
    END IF;

    v_subtotal := v_subtotal + round(v_product.price * v_quantity, 2);
  END LOOP;

  v_iva := round(v_subtotal * 0.16, 2);
  IF (p_order->>'subtotal')::numeric <> v_subtotal
     OR (p_order->>'iva')::numeric <> v_iva
     OR (p_order->>'total')::numeric <> v_subtotal + v_iva + v_delivery_fee THEN
    RAISE EXCEPTION 'Os valores do carrinho foram alterados. Actualize o carrinho e tente novamente.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.orders (
    id, customer_name, customer_email, customer_phone, customer_address,
    customer_nuit, payment_method, payment_proof_url, delivery_zone,
    subtotal, iva, delivery_fee, total, status
  ) VALUES (
    v_order_id, v_customer_name, v_customer_email, v_customer_phone, v_customer_address,
    nullif(btrim(coalesce(p_order->>'customer_nuit', '')), ''),
    v_payment_method, nullif(p_order->>'payment_proof_url', ''), v_delivery_zone,
    v_subtotal, v_iva, v_delivery_fee, v_subtotal + v_iva + v_delivery_fee, v_expected_status
  );

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_price, quantity)
    SELECT v_order_id, p.id, p.name, p.price, v_quantity
    FROM public.products AS p
    WHERE p.id = v_product_id;

    UPDATE public.products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(jsonb, jsonb) TO anon, authenticated;

-- Private bucket for bank-transfer evidence. Guests may upload, but only
-- administrators may read or delete submitted evidence.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nourish-payment-proofs',
  'nourish-payment-proofs',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Guests can upload payment proofs" ON storage.objects;
CREATE POLICY "Guests can upload payment proofs"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'nourish-payment-proofs'
  AND (storage.foldername(name))[1] = 'proofs'
  AND name ~ '^proofs/[0-9a-fA-F-]{36}\.(pdf|png|jpe?g|webp)$'
);

DROP POLICY IF EXISTS "Admins can view payment proofs" ON storage.objects;
CREATE POLICY "Admins can view payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'nourish-payment-proofs'
  AND public.has_role((select auth.uid()), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'nourish-payment-proofs'
  AND public.has_role((select auth.uid()), 'admin'::public.app_role)
);


-- Checkout writes must pass through the atomic RPC; direct table writes would
-- bypass stock reservation and server-side price calculation.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Guest checkout can create valid orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Guest checkout can insert valid order items" ON public.order_items;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

-- State transitions are server-side and cancellation releases reserved stock.
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current public.order_status;
BEGIN
  IF NOT public.has_role((select auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso reservado à administração.' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_current
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Encomenda não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (
    (v_current = 'pending' AND p_status = 'cancelled')
    OR (v_current = 'payment-submitted' AND p_status IN ('payment-verified', 'cancelled'))
    OR (v_current = 'payment-verified' AND p_status = 'shipped')
    OR (v_current = 'shipped' AND p_status = 'delivered')
  ) THEN
    RAISE EXCEPTION 'Transição de estado não permitida.' USING ERRCODE = '22023';
  END IF;

  IF p_status = 'cancelled' THEN
    UPDATE public.products AS p
    SET stock = p.stock + oi.quantity
    FROM public.order_items AS oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id = p.id;
  END IF;

  UPDATE public.orders
  SET status = p_status
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, public.order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, public.order_status) TO authenticated;


-- Unapproved supplier catalogues remain private to their owner and admins.
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;
CREATE POLICY "Approved suppliers are public"
ON public.suppliers FOR SELECT
TO anon, authenticated
USING (
  approved = true
  OR owner_id = (select auth.uid())
  OR public.has_role((select auth.uid()), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Approved supplier products are public"
ON public.products FOR SELECT
TO anon, authenticated
USING (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.suppliers AS s
    WHERE s.id = supplier_id
      AND (s.approved = true OR s.owner_id = (select auth.uid()))
  )
);

-- A supplier may edit its business profile but cannot self-approve, self-verify,
-- activate premium status, or change commercial entitlements.
CREATE OR REPLACE FUNCTION public.protect_supplier_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.approved OR NEW.verified OR NEW.premium_active
         OR NEW.rating <> 0
         OR NEW.premium_ad_discount <> 0.15
         OR NEW.premium_priority_slots <> 2
         OR NEW.premium_start_date IS NOT NULL
         OR NEW.premium_end_date IS NOT NULL THEN
        RAISE EXCEPTION 'Apenas a administração pode aprovar, verificar ou atribuir benefícios comerciais.' USING ERRCODE = '42501';
      END IF;
    ELSIF (
      NEW.approved IS DISTINCT FROM OLD.approved
      OR NEW.verified IS DISTINCT FROM OLD.verified
      OR NEW.premium_active IS DISTINCT FROM OLD.premium_active
      OR NEW.premium_start_date IS DISTINCT FROM OLD.premium_start_date
      OR NEW.premium_end_date IS DISTINCT FROM OLD.premium_end_date
      OR NEW.premium_ad_discount IS DISTINCT FROM OLD.premium_ad_discount
      OR NEW.premium_priority_slots IS DISTINCT FROM OLD.premium_priority_slots
      OR NEW.rating IS DISTINCT FROM OLD.rating
    ) THEN
      RAISE EXCEPTION 'Apenas a administração pode alterar aprovação, verificação, classificação e benefícios comerciais.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_supplier_approval_fields ON public.suppliers;
CREATE TRIGGER protect_supplier_approval_fields
BEFORE INSERT OR UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.protect_supplier_approval_fields();
