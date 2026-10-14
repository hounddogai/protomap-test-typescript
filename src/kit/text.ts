/**
 * Small string helpers shared by every area.
 */

/** Trims a value and lowers its case, so lookups ignore how people typed it. */
export function normalize(s: string): string {
  const trimmed = s.trim();
  if (trimmed.length === 0) return "";
  return trimmed.toLowerCase();
}

/** Turns a display name into a lowercase, dash-separated key. */
export function slugify(s: string): string {
  const parts = s.trim().toLowerCase().split(" ");
  const kept: string[] = [];
  for (const part of parts) {
    if (part.length > 0) {
      kept.push(part);
    }
  }
  return kept.join("-");
}

/** Shortens a value to at most limit characters, marking the cut with an ellipsis. */
export function truncate(s: string, limit: number): string {
  if (s.length <= limit) return s;
  if (limit <= 3) return s.slice(0, limit);
  return s.slice(0, limit - 3) + "...";
}

/** Masks all but the last keep characters, as receipts and logs show references. */
export function maskTail(s: string, keep: number): string {
  if (s.length <= keep) return s;
  const hidden = s.length - keep;
  return "*".repeat(hidden) + s.slice(s.length - keep);
}

export function wordCount(s: string): number {
  let count = 0;
  for (const word of s.trim().split(" ")) {
    if (word.length > 0) {
      count += 1;
    }
  }
  return count;
}

/** Reports whether any of the words occurs in s, ignoring case. */
export function containsAny(s: string, words: string[]): boolean {
  const lowered = s.toLowerCase();
  for (const word of words) {
    if (lowered.includes(word.toLowerCase())) return true;
  }
  return false;
}

export function joinNonEmpty(parts: string[], sep: string): string {
  const kept: string[] = [];
  for (const part of parts) {
    const clean = part.trim();
    if (clean !== "") {
      kept.push(clean);
    }
  }
  return kept.join(sep);
}

export function firstNonEmpty(parts: string[]): string {
  for (const part of parts) {
    if (part.trim() !== "") return part;
  }
  return "";
}

/** Pads or cuts a value to exactly width characters, for fixed-width output. */
export function fit(s: string, width: number): string {
  if (s.length > width) return s.slice(0, width);
  return s.padEnd(width, " ");
}
