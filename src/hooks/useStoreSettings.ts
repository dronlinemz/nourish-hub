import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DeliveryZone } from "@/types/store";

export interface StoreSettings {
  deliveryFees: Record<DeliveryZone, number>;
  premiumSettings: {
    adDiscount: number;
    prioritySlots: number;
    subscriptionMonths: number;
  };
  bankDetails: {
    bankName: string;
    account: string;
    nib: string;
    accountHolder: string;
  };
}

export interface StoreSettingsInput {
  deliveryFees: Record<DeliveryZone, number>;
  premiumSettings: StoreSettings["premiumSettings"];
  bankDetails: StoreSettings["bankDetails"];
}

const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFees: { maputo: 150, matola: 250 },
  premiumSettings: { adDiscount: 0.15, prioritySlots: 2, subscriptionMonths: 6 },
  bankDetails: { bankName: "", account: "", nib: "", accountHolder: "" },
};

export const useStoreSettings = () =>
  useQuery({
    queryKey: ["store-settings"],
    queryFn: async (): Promise<StoreSettings> => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", "default")
        .single();
      if (error) throw error;
      return {
        deliveryFees: {
          maputo: Number(data.delivery_fee_maputo),
          matola: Number(data.delivery_fee_matola),
        },
        premiumSettings: {
          adDiscount: Number(data.premium_ad_discount),
          prioritySlots: data.premium_priority_slots,
          subscriptionMonths: data.premium_subscription_months,
        },
        bankDetails: {
          bankName: data.bank_name,
          account: data.bank_account,
          nib: data.bank_nib,
          accountHolder: data.bank_account_holder,
        },
      };
    },
    initialData: DEFAULT_SETTINGS,
  });

export const useUpdateStoreSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: StoreSettingsInput) => {
      const { error } = await supabase.from("store_settings").upsert({
        id: "default",
        delivery_fee_maputo: settings.deliveryFees.maputo,
        delivery_fee_matola: settings.deliveryFees.matola,
        premium_ad_discount: settings.premiumSettings.adDiscount,
        premium_priority_slots: settings.premiumSettings.prioritySlots,
        premium_subscription_months: settings.premiumSettings.subscriptionMonths,
        bank_name: settings.bankDetails.bankName,
        bank_account: settings.bankDetails.account,
        bank_nib: settings.bankDetails.nib,
        bank_account_holder: settings.bankDetails.accountHolder,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["store-settings"] }),
  });
};
