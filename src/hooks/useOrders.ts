import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Order, CartItem } from "@/types/store";

const PAYMENT_PROOFS_BUCKET = "nourish-payment-proofs";

const mapOrder = (row: any): Order => ({
  id: row.id,
  items: (row.order_items ?? []).map((item: any) => ({
    quantity: Number(item.quantity),
    product: {
      id: item.product_id,
      name: item.product_name,
      description: "",
      price: Number(item.product_price),
      image: "",
      category: "nutricao",
      supplierId: "",
      stock: 0,
      featured: false,
      createdAt: item.created_at,
    },
  })),
  subtotal: Number(row.subtotal),
  iva: Number(row.iva),
  deliveryFee: Number(row.delivery_fee),
  deliveryZone: row.delivery_zone,
  total: Number(row.total),
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  customerAddress: row.customer_address,
  customerNuit: row.customer_nuit ?? undefined,
  paymentMethod: row.payment_method,
  paymentProofUrl: row.payment_proof_url ?? undefined,
  status: row.status,
  createdAt: row.created_at,
});

export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapOrder);
    },
  });

interface CreateOrderInput {
  order: Omit<Order, "id" | "createdAt">;
  items: CartItem[];
  proofFile?: File | null;
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, items, proofFile }: CreateOrderInput): Promise<Order> => {
      if (!items.length) throw new Error("O carrinho está vazio.");

      let proofPath: string | null = null;
      if (order.paymentMethod === "bank-transfer") {
        if (!proofFile) throw new Error("Anexe o comprovativo de transferência.");
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(proofFile.type) || proofFile.size > 5 * 1024 * 1024) {
          throw new Error("O comprovativo deve ser PDF ou imagem (JPG, PNG, WebP) até 5 MB.");
        }

        proofPath = `proofs/${crypto.randomUUID()}.${proofFile.type === "application/pdf" ? "pdf" : proofFile.type === "image/png" ? "png" : proofFile.type === "image/webp" ? "webp" : "jpg"}`;
        const { error: uploadError } = await supabase.storage
          .from(PAYMENT_PROOFS_BUCKET)
          .upload(proofPath, proofFile, { contentType: proofFile.type, upsert: false });
        if (uploadError) throw uploadError;
      }

      try {
        const payload = {
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
          customer_address: order.customerAddress,
          customer_nuit: order.customerNuit ?? null,
          payment_method: order.paymentMethod,
          payment_proof_url: proofPath,
          delivery_zone: order.deliveryZone,
          delivery_fee: order.deliveryFee,
          subtotal: order.subtotal,
          iva: order.iva,
          total: order.total,
          status: order.status,
        };
        const rpcItems = items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        }));

        const { data: orderId, error } = await supabase.rpc("create_guest_order", {
          p_order: payload,
          p_items: rpcItems,
        });
        if (error) throw error;

        const createdAt = new Date().toISOString();
        return {
          ...order,
          id: orderId,
          createdAt,
          paymentProofUrl: proofPath ?? undefined,
          items: [...items],
        };
      } catch (error) {
        if (proofPath) {
          await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([proofPath]);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
    },
  });
};
