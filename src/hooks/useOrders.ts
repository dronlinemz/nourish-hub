import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Order, CartItem } from "@/types/store";

const mapOrder = (row: any, items: CartItem[] = []): Order => ({
  id: row.id,
  items,
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

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapOrder(row));
    },
  });
};

interface CreateOrderInput {
  order: Omit<Order, "id" | "createdAt">;
  items: CartItem[];
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, items }: CreateOrderInput): Promise<Order> => {
      const orderId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      // Insert order
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
          customer_address: order.customerAddress,
          customer_nuit: order.customerNuit ?? null,
          payment_method: order.paymentMethod,
          payment_proof_url: order.paymentProofUrl ?? null,
          delivery_zone: order.deliveryZone,
          subtotal: order.subtotal,
          iva: order.iva,
          delivery_fee: order.deliveryFee,
          total: order.total,
          status: order.status,
        });

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { ...order, id: orderId, createdAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
