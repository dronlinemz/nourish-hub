import { useState, useEffect, useCallback, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import type { AdSpace } from "@/types/store";

type BannerVariant = "wide" | "compact" | "sidebar";

interface PartnerBannerProps {
  variant?: BannerVariant;
  /** Which ad space to pull ads from. Defaults based on variant. */
  space?: AdSpace;
  className?: string;
}

const VARIANT_DEFAULT_SPACE: Record<BannerVariant, AdSpace> = {
  wide: "hero",
  compact: "catalog-wide",
  sidebar: "catalog-sidebar",
};

const PartnerBanner = ({ variant = "wide", space, className = "" }: PartnerBannerProps) => {
  const { adCampaigns } = useStore();

  const resolvedSpace = space || VARIANT_DEFAULT_SPACE[variant];
  const activeAds = useMemo(
    () => adCampaigns.filter((a) => a.status === "active" && a.space === resolvedSpace),
    [adCampaigns, resolvedSpace]
  );

  const [currentAd, setCurrentAd] = useState(0);

  const nextAd = useCallback(() => {
    if (activeAds.length <= 1) return;
    setCurrentAd((s) => (s + 1) % activeAds.length);
  }, [activeAds.length]);

  useEffect(() => {
    const timer = setInterval(nextAd, 7000);
    return () => clearInterval(timer);
  }, [nextAd]);

  // Reset index if ads change
  useEffect(() => {
    setCurrentAd(0);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;

  const ad = activeAds[currentAd % activeAds.length];

  if (variant === "sidebar") {
    return (
      <div className={`rounded-xl overflow-hidden border border-border bg-card ${className}`}>
        <div className="relative h-32 overflow-hidden">
          <img src={ad.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
          <span className="absolute top-2 left-2 text-[10px] font-medium text-white/60 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">Publicidade</span>
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-0.5">{ad.partner}</p>
          <h4 className="font-display font-bold text-sm mb-1">{ad.title}</h4>
          <p className="text-xs text-muted-foreground mb-2">{ad.description}</p>
          <a href={ad.url} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {ad.cta} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        {activeAds.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-2">
            {activeAds.map((_, i) => (
              <button key={i} onClick={() => setCurrentAd(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${currentAd === i ? "bg-primary" : "bg-muted-foreground/20"}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`rounded-xl overflow-hidden border border-border bg-card ${className}`}>
        <div className="flex items-center gap-4 p-3">
          <img src={ad.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground/60 font-medium">Publicidade · {ad.partner}</span>
            <h4 className="font-display font-bold text-sm truncate">{ad.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{ad.description}</p>
          </div>
          <a href={ad.url} className="flex-shrink-0 text-xs font-semibold text-primary hover:underline whitespace-nowrap">{ad.cta}</a>
        </div>
      </div>
    );
  }

  // Wide (default)
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {activeAds.map((a, i) => (
        <div key={a.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: currentAd === i ? 1 : 0 }}>
          <img src={a.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/40 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 flex items-center justify-between p-6 md:p-8 min-h-[140px]">
        <div className="max-w-md">
          <span className="text-[10px] font-medium text-white/50 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">Publicidade · {ad.partner}</span>
          <h3 className="font-display font-bold text-lg md:text-xl text-white mt-2 mb-1">{ad.title}</h3>
          <p className="text-sm text-white/70">{ad.description}</p>
        </div>
        <a href={ad.url} className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          {ad.cta} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {activeAds.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {activeAds.map((_, i) => (
            <button key={i} onClick={() => setCurrentAd(i)} className={`h-1.5 rounded-full transition-all duration-300 ${currentAd === i ? "w-5 bg-primary" : "w-1.5 bg-white/30"}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerBanner;
