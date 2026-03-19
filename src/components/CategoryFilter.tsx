import { Apple, Pill, Cross, GraduationCap, Dumbbell, Armchair, Leaf, Stethoscope } from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/types/store";

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  "alimentacao-saudavel": <Apple className="w-4 h-4" />,
  "suplementos": <Pill className="w-4 h-4" />,
  "primeiros-socorros": <Cross className="w-4 h-4" />,
  "equipamento-estudante": <GraduationCap className="w-4 h-4" />,
  "fitness-recuperacao": <Dumbbell className="w-4 h-4" />,
  "ergonomia": <Armchair className="w-4 h-4" />,
  "nutricao": <Leaf className="w-4 h-4" />,
  "diagnostico": <Stethoscope className="w-4 h-4" />,
};

interface CategoryFilterProps {
  selected: Category | null;
  onChange: (cat: Category | null) => void;
}

const CategoryFilter = ({ selected, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1.5 px-1.5">
      <button
        onClick={() => onChange(null)}
        className={`badge-category ${selected === null ? "badge-category-active" : ""}`}
      >
        Todos
      </button>
      {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`badge-category ${selected === key ? "badge-category-active" : ""}`}
        >
          {CATEGORY_ICONS[key]}
          {label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
