import { useState, useEffect } from "react";
import api from "../api";

export interface Property {
  property_id: string;
  name: string;
  type: string;
  country: string;
  state: string;
  city: string;
  address: string;
  currency: string;
  cover_photo: string;
  distance_km?: number;
  total_price?: number;
  lowest_rate?: number;
  nights?: number;
  description?: string;
  total_rooms?: number;
  year_built?: number;
  phone_number?: string;
  email?: string;
  system_amenities?: { id: string; name: string; icon: string }[];
  custom_amenities?: { icon: string | null; name: string }[];
}

export function useSearchProperties(destination: string, limit = 6) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const { data } = await api.get("/search", {
          params: {
            destination,
            check_in: today,
            check_out: tomorrow,
            adults: "2",
            children: "0",
            rooms: "1",
          },
        });
        const results: Property[] = data?.data?.results
          || (Array.isArray(data?.data) ? data.data : data?.results || []);
        const withDetails = await Promise.all(
          results.slice(0, limit).map(async (p) => {
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
        setProperties(withDetails);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [destination, limit]);

  return { properties, loading };
}
