import { useState, useEffect } from "react";
import api from "../api";
import { Property } from "./useSearchProperties";
import { getDefaultDates } from "../utils/date";

function hasPermissionApi(): boolean {
  return typeof navigator !== "undefined" && "permissions" in navigator;
}

export function useNearbyProperties(limit = 6) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchNearby = async () => {
      setLoading(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });
        const { today, tomorrow } = getDefaultDates();
        const { data } = await api.get("/search/nearby", {
          params: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            limit,
            check_in: today,
            check_out: tomorrow,
            adults: 2,
            children: 0,
            rooms: 1,
          },
        });
        const results: Property[] = data?.data || [];
        const withDetails = await Promise.all(
          results.map(async (p) => {
            try {
              const { data: detail } = await api.get(`/properties/${p.property_id}/public`);
              const prop = detail?.data;
              return {
                ...p,
                description: prop?.description || "",
                total_rooms: prop?.total_rooms || 0,
                year_built: prop?.year_built || 0,
                phone_number: prop?.phone_number || "",
                email: prop?.email || "",
                system_amenities: prop?.system_amenities || [],
                custom_amenities: prop?.custom_amenities || [],
                total_price: p.lowest_rate ?? p.total_price ?? 0,
                currency: prop?.currency || p.currency,
              };
            } catch {
              return p;
            }
          })
        );
        if (!cancelled) setProperties(withDetails);
      } catch {
        if (!cancelled) setProperties([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const maybeFetchNearby = async () => {
      if (!hasPermissionApi()) {
        setLoading(false);
        return;
      }
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "granted") {
          await fetchNearby();
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    maybeFetchNearby();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { properties, loading };
}
