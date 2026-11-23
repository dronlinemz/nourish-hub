import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Supplier } from "@/types/store";
import type { Database } from "@/integrations/supabase/types";

const mapSupplier = (row: Database["public"]["Tables"]["suppliers"]["Row"]): Supplier => ({
  id: row.id,
  name: row.name,
  description: row.description,
  location: row.location,
  rating: Number(row.rating),
  verified: row.verified,
  approved: row.approved,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone,
  logo: row.logo ?? undefined,
  premium: row.premium_active
    ? {
        active: true,
        startDate: row.premium_start_date ?? "",
        endDate: row.premium_end_date ?? "",
        adDiscount: Number(row.premium_ad_discount),
        prioritySlots: row.premium_priority_slots,
      }
    : undefined,
  createdAt: row.created_at,
});

export const useSuppliers = () => {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapSupplier);
    },
  });
};
