import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Supplier } from "@/types/store";

export interface SupplierFormValues {
  name: string;
  description: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  logo?: string;
}

export const useMySupplier = (userId?: string) =>
  useQuery({
    queryKey: ["my-supplier", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Supplier | null> => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("owner_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        location: data.location,
        rating: Number(data.rating),
        verified: data.verified,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        logo: data.logo ?? undefined,
        createdAt: data.created_at,
      };
    },
  });

export const useSaveSupplier = (userId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: SupplierFormValues }) => {
      const payload = {
        name: values.name,
        description: values.description,
        location: values.location,
        contact_email: values.contactEmail,
        contact_phone: values.contactPhone,
        logo: values.logo || null,
      };
      if (id) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("suppliers")
        .insert({ ...payload, owner_id: userId! })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-supplier"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useSupplierProducts = (supplierId?: string) =>
  useQuery({
    queryKey: ["supplier-products", supplierId],
    enabled: !!supplierId,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", supplierId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        originalPrice: row.original_price ? Number(row.original_price) : undefined,
        image: row.image,
        category: row.category,
        supplierId: row.supplier_id,
        stock: row.stock,
        featured: row.featured,
        createdAt: row.created_at,
      }));
    },
  });

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  category: Product["category"];
  stock: number;
}

export const useSaveProduct = (supplierId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProductFormValues }) => {
      const payload = {
        name: values.name,
        description: values.description,
        price: values.price,
        original_price: values.originalPrice ?? null,
        image: values.image,
        category: values.category,
        stock: values.stock,
        supplier_id: supplierId!,
      };
      if (id) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
