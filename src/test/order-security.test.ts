import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const orderMigration = readFileSync(
  "drizzle/migrations/0000_restrict_guest_order_access.sql",
  "utf8",
);
const vatMigration = readFileSync(
  "drizzle/migrations/0001_align_guest_order_vat_validation.sql",
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

  it("keeps guest checkout and accepts the exact fractional 16% tax", () => {
    const subtotal = 1.01;
    const iva = subtotal * 0.16;
    const total = subtotal + iva + 150;

    expect(iva).toBe(0.1616);
    expect(total).toBe(151.1716);
    expect(orderMigration).toMatch(
      /CREATE POLICY "Guest checkout can create valid orders"[\s\S]*?TO anon, authenticated[\s\S]*?btrim\(customer_name\) <> ''[\s\S]*?btrim\(customer_phone\) <> ''[\s\S]*?total = subtotal \+ iva \+ delivery_fee[\s\S]*?payment_method = 'mpesa'[\s\S]*?status = 'pending'[\s\S]*?payment_method = 'bank-transfer'[\s\S]*?status = 'payment-submitted'/,
    );
    expect(vatMigration).toMatch(
      /CREATE POLICY "Guest checkout can create valid orders"[\s\S]*?iva = subtotal \* 0\.16/,
    );
  });

  it("accepts order items only when they match catalog products", () => {
    expect(orderMigration).toMatch(
      /CREATE POLICY "Guest checkout can insert valid order items"[\s\S]*?TO anon, authenticated[\s\S]*?quantity > 0[\s\S]*?FROM public\.products AS p[\s\S]*?p\.id = product_id[\s\S]*?p\.name = product_name[\s\S]*?p\.price = product_price/,
    );
  });
});