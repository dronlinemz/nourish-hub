import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateIva } from "../types/store";

const orderMigration = readFileSync(
  "drizzle/migrations/0000_restrict_guest_order_access.sql",
  "utf8",
);
const vatMigration = readFileSync(
  "drizzle/migrations/0002_round_order_vat_to_cents.sql",
  "utf8",
);
const supabaseOrderMigration = readFileSync(
  "supabase/migrations/20261123090000_harden_guest_order_access.sql",
  "utf8",
);
const atomicCheckoutMigration = readFileSync(
  "supabase/migrations/20261123100000_atomic_checkout_stock_and_payment_proofs.sql",
  "utf8",
);

describe("order access and checkout integrity", () => {
  it("limits order and item reads to administrators", () => {
    expect(orderMigration).toMatch(
      /CREATE POLICY "Admins can view orders"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)\)/,
    );
    expect(orderMigration).toMatch(
      /CREATE POLICY "Admins can view order items"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)\)/,
    );
  });

  it("keeps the Supabase guest-order policies aligned with the hardened rules", () => {
    expect(supabaseOrderMigration).toMatch(/CREATE POLICY "Admins can view orders"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated/);
    expect(supabaseOrderMigration).toMatch(/CREATE POLICY "Admins can view order items"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated/);
    expect(supabaseOrderMigration).toMatch(/CREATE POLICY "Guest checkout can insert valid order items"[\s\S]*?quantity > 0[\s\S]*?p\.price = product_price/);
    expect(supabaseOrderMigration).toMatch(/iva = round\(subtotal \* 0\.16, 2\)/);
  });

  it("creates orders atomically, validates catalogue prices and reserves stock", () => {
    expect(atomicCheckoutMigration).toMatch(/CREATE OR REPLACE FUNCTION public\.create_guest_order/);
    expect(atomicCheckoutMigration).toMatch(/FOR UPDATE OF p/);
    expect(atomicCheckoutMigration).toMatch(/v_product\.stock < v_quantity/);
    expect(atomicCheckoutMigration).toMatch(/SET stock = stock - v_quantity/);
    expect(atomicCheckoutMigration).toMatch(/REVOKE INSERT ON public\.orders FROM anon, authenticated/);
    expect(atomicCheckoutMigration).toMatch(/REVOKE INSERT ON public\.order_items FROM anon, authenticated/);
    expect(atomicCheckoutMigration).toMatch(/v_subtotal := v_subtotal \+ round\(v_product\.price \* v_quantity, 2\)/);
  });

  it("protects supplier approval and applies order transitions on the server", () => {
    expect(atomicCheckoutMigration).toMatch(/BEFORE INSERT OR UPDATE ON public\.suppliers/);
    expect(atomicCheckoutMigration).toMatch(/NEW\.approved IS DISTINCT FROM OLD\.approved/);
    expect(atomicCheckoutMigration).toMatch(/public\.admin_update_order_status/);
    expect(atomicCheckoutMigration).toMatch(/public\.has_role\(\(select auth\.uid\(\)\), 'admin'::public\.app_role\)/);
    expect(atomicCheckoutMigration).toMatch(/SET stock = p\.stock \+ oi\.quantity/);
    expect(atomicCheckoutMigration).toMatch(/approved = true/);
  });

  it("keeps payment evidence private and enforces a bounded upload", () => {
    expect(atomicCheckoutMigration).toContain("'nourish-payment-proofs'");
    expect(atomicCheckoutMigration).toContain("5242880");
    expect(atomicCheckoutMigration).toMatch(/CREATE POLICY "Admins can view payment proofs"/);
    expect(atomicCheckoutMigration).toMatch(/CREATE POLICY "Guests can upload payment proofs"/);
  });

  it("rounds 16% VAT to cents", () => {
    const subtotal = 1.01;
    const iva = calculateIva(subtotal);
    expect(iva).toBe(0.16);
    expect(subtotal + iva + 150).toBe(151.17);
    expect(vatMigration).toMatch(/iva = round\(subtotal \* 0\.16, 2\)/);
  });
});
