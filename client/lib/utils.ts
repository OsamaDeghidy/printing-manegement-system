export function cn(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return target.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}


