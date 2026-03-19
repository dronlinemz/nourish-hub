import { CATEGORY_LABELS, type Category } from "@/types/store";

interface CategoryFilterProps {
  selected: Category | null;
  onChange: (cat: Category | null) => void;
}

const CategoryFilter = ({ selected, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
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
          {label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
