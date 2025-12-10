"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFetch } from "@/lib/hooks/useFetch";

type Props = {
  endpoint: string;
  selected: number[];
  onChange: (ids: number[]) => void;
  label: string;
};

export function CustomCheckbox({ endpoint, selected, onChange, label }: Props) {
  const { data, loading, error } = useFetch<{ id: number; name: string }>(endpoint);

  if (loading) return <p>Cargando {label}...</p>;
  if (error) return <p>Error cargando {label}</p>;

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((i) => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-semibold">{label}</Label>
      <div className="flex flex-wrap gap-3">
        {data.map((item) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${endpoint}-${item.id}`}
              checked={selected.includes(item.id)}
              onCheckedChange={() => toggle(item.id)}
            />
            <Label htmlFor={`${endpoint}-${item.id}`}>{item.name}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}