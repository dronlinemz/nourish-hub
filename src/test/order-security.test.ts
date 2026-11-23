import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "drizzle/migrations/0000_restrict_guest_order_access.sql",
  "utf8",
);

describe("order access policies", () => {
  it("limits order and item reads to administrators", () => {
    expect(migration).toMatch(
      /CREATE POLICY "Admins can view orders"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)\)/,
    );
    expect(migration).toMatch(
      /CREATE POLICY "Admins can view order items"[\s\S]*?FOR SELECT[\s\S]*?TO authenticated[\s\S]*?USING \(public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)\)/,
    );
  });

  it("keeps guest checkout while validating totals and payment status", () => {
    expect(migration).toMatch(
      /CREATE POLICY "Guest checkout can create valid orders"[\s\S]*?TO anon, authenticated[\s\S]*?btrim\(customer_name\) <> ''[\s\S]*?btrim\(customer_phone\) <> ''[\s\S]*?iva = round\(subtotal \* 0\.16, 2\)[\s\S]*?total = subtotal \+ iva \+ delivery_fee[\s\S]*?payment_method = 'mpesa'[\s\S]*?status = 'pending'[\s\S]*?payment_method = 'bank-transfer'[\s\S]*?status = 'payment-submitted'/,
    );
  });

  it("accepts order items only when they match catalog products", () => {
    expect(migration).toMatch(
      /CREATE POLICY "Guest checkout can insert valid order items"[\s\S]*?TO anon, authenticated[\s\S]*?quantity > 0[\s\S]*?FROM public\.products AS p[\s\S]*?p\.id = product_id[\s\S]*?p\.name = product_name[\s\S]*?p\.price = product_price/,
    );
  });
});