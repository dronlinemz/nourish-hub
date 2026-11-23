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

describe("order access policies", () => {
  it("limits order and item reads to administrators", () => {
    expect(orderMigration).toMatch(
      /CREATE POLICY "Admins can view orders"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)\)/,
    );
    expect(orderMigration).toMatch(
      /CREATE POLICY "Admins can view order items"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)\)/,
    );
  });

  it("keeps the deployed Supabase policies aligned with the hardened order rules", () => {
    expect(supabaseOrderMigration).toMatch(/CREATE POLICY "Admins can view orders"[\\s\\S]*?FOR SELECT[\\s\\S]*?TO authenticated/);
    expect(supabaseOrderMigration).toMatch(/CREATE POLICY "Admins can view order items"[\\s\\S]*?FOR SELECT[\\s\\S]*?TO authenticated/);
    expect(supabaseOrderMigration).toMatch(/CREATE POLICY "Guest checkout can insert valid order items"[\\s\\S]*?quantity > 0[\\s\\S]*?p\\.price = product_price/);
    expect(supabaseOrderMigration).toMatch(/iva = round\\(subtotal \\* 0\\.16, 2\\)/);
  });

  it("keeps guest checkout and rounds 16% tax to cents", () => {
    const subtotal = 1.01;
    const iva = calculateIva(subtotal);
    const total = subtotal + iva + 150;

    expect(iva).toBe(0.16);
    expect(total).toBe(151.17);
    expect(orderMigration).toMatch(
      /CREATE POLICY "Guest checkout can create valid orders"[\s\S]*?TO anon, authenticated[\s\S]*?btrim\(customer_name\) <> ''[\s\S]*?btrim\(customer_phone\) <> ''[\s\S]*?total = subtotal \+ iva \+ delivery_fee[\s\S]*?payment_method = 'mpesa'[\s\S]*?status = 'pending'[\s\S]*?payment_method = 'bank-transfer'[\s\S]*?status = 'payment-submitted'/,
    );
    expect(vatMigration).toMatch(
      /CREATE POLICY "Guest checkout can create valid orders"[\s\S]*?iva = round\(subtotal \* 0\.16, 2\)/,
    );
  });

  it("accepts order items only when they match catalog products", () => {
    expect(orderMigration).toMatch(
      /CREATE POLICY "Guest checkout can insert valid order items"[\s\S]*?TO anon, authenticated[\s\S]*?quantity > 0[\s\S]*?FROM public\.products AS p[\s\S]*?p\.id = product_id[\s\S]*?p\.name = product_name[\s\S]*?p\.price = product_price/,
    );
  });
});