import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVerseRange(numbers: number[]): string {
  if (!numbers || numbers.length === 0) return '';
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = start;

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (start === prev) {
        ranges.push(`${start}`);
      } else {
        ranges.push(`${start}-${prev}`);
      }
      start = current;
      prev = current;
    }
  }
  return ranges.join(', ');
}
