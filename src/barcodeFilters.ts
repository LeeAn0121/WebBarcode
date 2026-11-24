export type QuickFilter = "all" | "today" | "hasMemo";

interface FilterableBarcode {
  created_at: string;
  memo?: string | null;
}

export function applyQuickFilter<T extends FilterableBarcode>(
  records: readonly T[],
  filter: QuickFilter,
  now = new Date(),
): T[] {
  return records.filter((record) => {
    if (filter === "today")
      return new Date(record.created_at).toDateString() === now.toDateString();
    if (filter === "hasMemo") return Boolean(record.memo?.trim());
    return true;
  });
}

export function getQuickFilterCounts(
  records: readonly FilterableBarcode[],
  now = new Date(),
) {
  return {
    all: records.length,
    today: applyQuickFilter(records, "today", now).length,
    hasMemo: applyQuickFilter(records, "hasMemo", now).length,
  };
}
