-- Atomic guest checkout: server-side pricing, stock reservation and order lines.
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
  IF jsonb_typeof(p_order) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Dados da encomenda inválidos.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Itens da encomenda inválidos.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'O carrinho está vazio.' USING ERRCODE = '22023';
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
  SELECT CASE v_delivery_zone
    WHEN 'maputo' THEN delivery_fee_maputo
    WHEN 'matola' THEN delivery_fee_matola
  END
  INTO v_delivery_fee
  FROM public.store_settings
  WHERE id = 'default';

  IF v_delivery_fee IS NULL
     OR (p_order->>'delivery_fee')::numeric <> v_delivery_fee
     OR (p_order->>'status')::public.order_status <> v_expected_status THEN
    RAISE EXCEPTION 'Método de pagamento, estado ou taxa de entrega inválidos.' USING ERRCODE = '22023';
  END IF;

  IF v_payment_method = 'bank-transfer' THEN
    IF coalesce(p_order->>'payment_proof_url', '') !~ '^proofs/[0-9a-fA-F-]{36}\.(pdf|png|jpe?g|webp)
  IF v_payment_method = 'mpesa' AND nullif(p_order->>'payment_proof_url', '') IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido anexar comprovativo a este método de pagamento.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) AS x(value)
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

    SELECT p.* INTO v_product
    FROM public.products AS p
    JOIN public.suppliers AS s ON s.id = p.supplier_id
    WHERE p.id = v_product_id
      AND s.approved = true
    FOR UPDATE OF p;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Um dos produtos não está disponível para venda.' USING ERRCODE = 'P0002';
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

-- Bank-transfer evidence is private and available only to administrators.
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

-- Checkout writes must pass through the RPC; direct inserts would bypass stock control.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Guest checkout can create valid orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Guest checkout can insert valid order items" ON public.order_items;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

-- Only administrators can advance order states; cancellation releases reserved stock.
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

  UPDATE public.orders SET status = p_status WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, public.order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, public.order_status) TO authenticated;

-- Public catalogue RLS can test only the caller's own admin role without
-- granting anon access to has_role(user_id, role), which accepts arbitrary IDs.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $is_admin$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  )
$is_admin$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Unapproved supplier catalogues remain private to their owner and admins.
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;
CREATE POLICY "Approved suppliers are public"
ON public.suppliers FOR SELECT TO anon, authenticated
USING (
  approved = true
  OR owner_id = (select auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Approved supplier products are public"
ON public.products FOR SELECT TO anon, authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.suppliers AS s
    WHERE s.id = supplier_id
      AND (s.approved = true OR s.owner_id = (select auth.uid()))
  )
);

-- Supplier accounts cannot self-approve or grant themselves commercial privileges.
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


-- Persist operational delivery and premium settings instead of keeping them
-- only in the browser's React state.
CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  delivery_fee_maputo numeric(10,2) NOT NULL DEFAULT 150 CHECK (delivery_fee_maputo >= 0),
  delivery_fee_matola numeric(10,2) NOT NULL DEFAULT 250 CHECK (delivery_fee_matola >= 0),
  premium_ad_discount numeric(3,2) NOT NULL DEFAULT 0.15 CHECK (premium_ad_discount BETWEEN 0 AND 1),
  premium_priority_slots integer NOT NULL DEFAULT 2 CHECK (premium_priority_slots BETWEEN 0 AND 10),
  premium_subscription_months integer NOT NULL DEFAULT 6 CHECK (premium_subscription_months BETWEEN 1 AND 24),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_nib text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_holder text NOT NULL DEFAULT '';

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.store_settings TO authenticated;

DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
CREATE POLICY "Anyone can read store settings"
ON public.store_settings FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
CREATE POLICY "Admins can update store settings"
ON public.store_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
CREATE POLICY "Admins can insert store settings"
ON public.store_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.update_store_settings_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $store_settings_timestamp$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$store_settings_timestamp$;

DROP TRIGGER IF EXISTS update_store_settings_timestamp ON public.store_settings;
CREATE TRIGGER update_store_settings_timestamp
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_timestamp();

       OR NOT EXISTS (
         SELECT 1 FROM storage.objects
         WHERE bucket_id = 'nourish-payment-proofs'
           AND name = p_order->>'payment_proof_url'
       ) THEN
      RAISE EXCEPTION 'Comprovativo de pagamento inválido ou não encontrado.' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF v_payment_method = 'mpesa' AND nullif(p_order->>'payment_proof_url', '') IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido anexar comprovativo a este método de pagamento.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) AS x(value)
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

    SELECT p.* INTO v_product
    FROM public.products AS p
    JOIN public.suppliers AS s ON s.id = p.supplier_id
    WHERE p.id = v_product_id
      AND s.approved = true
    FOR UPDATE OF p;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Um dos produtos não está disponível para venda.' USING ERRCODE = 'P0002';
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

-- Bank-transfer evidence is private and available only to administrators.
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

-- Checkout writes must pass through the RPC; direct inserts would bypass stock control.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Guest checkout can create valid orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Guest checkout can insert valid order items" ON public.order_items;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

-- Only administrators can advance order states; cancellation releases reserved stock.
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

  UPDATE public.orders SET status = p_status WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, public.order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, public.order_status) TO authenticated;

-- Public catalogue RLS can test only the caller's own admin role without
-- granting anon access to has_role(user_id, role), which accepts arbitrary IDs.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $is_admin$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  )
$is_admin$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Unapproved supplier catalogues remain private to their owner and admins.
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;
CREATE POLICY "Approved suppliers are public"
ON public.suppliers FOR SELECT TO anon, authenticated
USING (
  approved = true
  OR owner_id = (select auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Approved supplier products are public"
ON public.products FOR SELECT TO anon, authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.suppliers AS s
    WHERE s.id = supplier_id
      AND (s.approved = true OR s.owner_id = (select auth.uid()))
  )
);

-- Supplier accounts cannot self-approve or grant themselves commercial privileges.
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


-- Persist operational delivery and premium settings instead of keeping them
-- only in the browser's React state.
CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  delivery_fee_maputo numeric(10,2) NOT NULL DEFAULT 150 CHECK (delivery_fee_maputo >= 0),
  delivery_fee_matola numeric(10,2) NOT NULL DEFAULT 250 CHECK (delivery_fee_matola >= 0),
  premium_ad_discount numeric(3,2) NOT NULL DEFAULT 0.15 CHECK (premium_ad_discount BETWEEN 0 AND 1),
  premium_priority_slots integer NOT NULL DEFAULT 2 CHECK (premium_priority_slots BETWEEN 0 AND 10),
  premium_subscription_months integer NOT NULL DEFAULT 6 CHECK (premium_subscription_months BETWEEN 1 AND 24),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_nib text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_holder text NOT NULL DEFAULT '';

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.store_settings TO authenticated;

DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
CREATE POLICY "Anyone can read store settings"
ON public.store_settings FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
CREATE POLICY "Admins can update store settings"
ON public.store_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
CREATE POLICY "Admins can insert store settings"
ON public.store_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.update_store_settings_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $store_settings_timestamp$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$store_settings_timestamp$;

DROP TRIGGER IF EXISTS update_store_settings_timestamp ON public.store_settings;
CREATE TRIGGER update_store_settings_timestamp
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.update_store_settings_timestamp();
