import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Supplier, OrderStatus } from "@/types/store";

export const useAdminProductMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });
  const save = useMutation({
    mutationFn: async (product: Product) => {
      const payload = {
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice ?? null,
        image: product.image,
        category: product.category,
        supplier_id: product.supplierId,
        stock: product.stock,
        featured: product.featured,
      };
      const result = product.id.startsWith("prod-")
        ? await supabase.from("products").insert(payload)
        : await supabase.from("products").update(payload).eq("id", product.id);
      if (result.error) throw result.error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { save, remove };
};

export const useAdminSupplierMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["suppliers"] });
  const save = useMutation({
    mutationFn: async (supplier: Supplier) => {
      const payload = {
        name: supplier.name,
        description: supplier.description,
        location: supplier.location,
        contact_email: supplier.contactEmail,
        contact_phone: supplier.contactPhone,
        logo: supplier.logo ?? null,
        rating: supplier.rating,
        verified: supplier.verified,
        premium_active: supplier.premium?.active ?? false,
        premium_start_date: supplier.premium?.startDate || null,
        premium_end_date: supplier.premium?.endDate || null,
        premium_ad_discount: supplier.premium?.adDiscount ?? 0,
        premium_priority_slots: supplier.premium?.prioritySlots ?? 0,
      };
      const result = supplier.id.startsWith("sup-")
        ? await supabase.from("suppliers").insert({ ...payload, approved: true })
        : await supabase.from("suppliers").update(payload).eq("id", supplier.id);
      if (result.error) throw result.error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { save, remove };
};

export const useAdminOrderMutations = () => {
  const queryClient = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
  return { updateStatus };
};
