import { useEffect, useMemo, useState } from "react";
import { ExistingFood } from "../types";
import { getKcalFromFood } from "../utils";
import { DEFAULTS } from "../constants";

type UseFoodSearchParams = {
  apiBase: string;
  open: boolean; 
  initialFoods?: ExistingFood[];
};

export function useFoodSearch({ apiBase, open, initialFoods }: UseFoodSearchParams) {
  const [allFoods, setAllFoods] = useState<ExistingFood[]>(initialFoods ?? []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExistingFood[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<ExistingFood | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setIsLoadingFoods(true);
    (async () => {
      try {
        const res = await fetch(`${apiBase}/foods`);
        const data: (ExistingFood & { FoodID?: number })[] = await res.json();
        if (!cancel) {
          // Map FoodID to id for consistency
          const mappedData = Array.isArray(data) ? data.map(food => ({
            ...food,
            id: food.FoodID || food.id
          })) : [];
          setAllFoods(mappedData);
          setIsLoadingFoods(false);
        }
      } catch {
        if (!cancel) setIsLoadingFoods(false);
      }
    })();
    return () => { cancel = true; };
  }, [apiBase, open]);

  const [q, setQ] = useState("");
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setQ(query.trim().toLowerCase()), DEFAULTS.SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    if (!q) {
      setResults([]); setShowDropdown(false); setActiveIndex(-1); setSelected(null);
      return;
    }
    const filtered = allFoods.filter(f => f.name?.toLowerCase().includes(q)).slice(0, DEFAULTS.MAX_SEARCH_RESULTS);
    setResults(filtered);
    setShowDropdown(true);
    setActiveIndex(filtered.length ? 0 : -1);

    const exact = filtered.find(f => f.name?.toLowerCase() === q);
    if (exact) {
      setSelected(exact);
      setShowDropdown(false);
    } else {
      setSelected(null);
    }
  }, [q, allFoods, open]);

  const kcalSelected = useMemo(() => getKcalFromFood(selected), [selected]);

  return {
    query, setQuery,
    results, showDropdown,
    selected, setSelected,
    activeIndex, setActiveIndex,
    kcalSelected,
    allFoods, // Export allFoods so we can check for duplicates
    isLoadingFoods,
    isLoadingDetails,
    setIsLoadingDetails,
  };
}