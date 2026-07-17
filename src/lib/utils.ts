import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

export function getCurrentSessionAttendanceCount(patient: any) {
  if (!patient || !patient.attendance) return 0;

  const presentDates = Object.entries(patient.attendance)
    .filter(([_, status]) => status === "present")
    .map(([date, _]) => date);

  const archivedDates = (patient.paymentHistory || [])
    .flatMap((h: any) => h.completedDates || []);

  const archivedSet = new Set(archivedDates);
  const currentSessionDates = presentDates.filter(d => !archivedSet.has(d));

  return currentSessionDates.length;
}

export function highlightText(text: string, searchTerm: string) {
  if (!searchTerm?.trim() || !text) return text;
  
  const trimmedTerm = searchTerm.trim();
  const escapedTerm = trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
  
  return parts.map((part) => 
    part.toLowerCase() === trimmedTerm.toLowerCase() ? 
      `<span class="bg-yellow-300 text-black font-bold px-0.5 rounded">${part}</span>` : 
      part
  ).join('');
}
