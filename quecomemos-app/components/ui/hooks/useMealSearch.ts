import { useEffect, useState, useRef } from "react";
import { Meal } from "@/lib/contexts/MealsContext";

const SEARCH_DEBOUNCE_MS = 250;
const MAX_SEARCH_RESULTS = 12;

type UseMealSearchParams = {
  apiBase: string;
  open: boolean; 
  initialMeals?: Meal[];
};

export function useMealSearch({ apiBase, open, initialMeals }: UseMealSearchParams) {
  const [allMeals, setAllMeals] = useState<Meal[]>(initialMeals ?? []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Meal[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Meal | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Update allMeals when initialMeals changes
  useEffect(() => {
    if (initialMeals && initialMeals.length > 0) {
      setAllMeals(initialMeals);
    }
  }, [initialMeals]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setIsLoadingMeals(true);
    (async () => {
      try {
        const res = await fetch(`${apiBase}/meals`);
        const data: Meal[] = await res.json();
        if (!cancel) {
          setAllMeals(Array.isArray(data) ? data : []);
          setIsLoadingMeals(false);
        }
      } catch {
        if (!cancel) setIsLoadingMeals(false);
      }
    })();
    return () => { cancel = true; };
  }, [apiBase, open]);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery) {
      setResults([]); 
      setShowDropdown(false); 
      setActiveIndex(-1); 
      setSelected(null);
      return;
    }
    
    const filtered = allMeals.filter(meal => 
      meal.name?.toLowerCase().includes(debouncedQuery) ||
      meal.description?.toLowerCase().includes(debouncedQuery)
    ).slice(0, MAX_SEARCH_RESULTS);
    
    setResults(filtered);
    setShowDropdown(true);
    setActiveIndex(filtered.length ? 0 : -1);

    const exact = filtered.find(meal => meal.name?.toLowerCase() === debouncedQuery);
    if (exact) {
      setSelected(exact);
      setShowDropdown(false);
    } else {
      setSelected(null);
    }
  }, [debouncedQuery, allMeals, open]);

  const resetSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    setSelected(null);
  };

  const selectMeal = (meal: Meal) => {
    setSelected(meal);
    setQuery(meal.name);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          selectMeal(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  return {
    query, 
    setQuery,
    results, 
    showDropdown,
    selected, 
    setSelected,
    activeIndex, 
    setActiveIndex,
    allMeals,
    isLoadingMeals,
    resetSearch,
    selectMeal,
    handleKeyDown,
    hasExactMatch: !!selected,
    canCreateNew: query.trim().length > 0 && !selected && results.length === 0,
    searchRef
  };
}