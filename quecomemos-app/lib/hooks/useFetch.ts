import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config/api";

export function useFetch<T = unknown>(endpoint: string, options?: RequestInit) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${endpoint}`, options);
        if (!res.ok) throw new Error("Error fetching data");
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint, options]);

  return { data, loading, error };
}