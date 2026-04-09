import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/store";

const mapProduct = (row: any): Product => ({
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
});

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },
  });
};
