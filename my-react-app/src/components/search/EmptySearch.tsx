interface EmptySearchProps {
  hasSearchCriteria: boolean;
}

export function EmptySearch({ hasSearchCriteria }: EmptySearchProps) {
  return (
    <div className="text-center py-20">
      <p className="text-sm" style={{ color: "var(--brand-text-secondary)" }}>
        {!hasSearchCriteria
          ? "Enter a destination to search for properties."
          : "No properties found. Try a different search."}
      </p>
    </div>
  );
}
