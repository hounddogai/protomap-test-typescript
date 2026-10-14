/**
 * Generic helpers over lists and maps.
 */

/** Returns the items keep accepts, in order. */
export function filter<T>(items: T[], keep: (value: T) => boolean): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (keep(item)) {
      out.push(item);
    }
  }
  return out;
}

export function countBy<T>(items: T[], key: (value: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const tallyKey = key(item);
    counts.set(tallyKey, (counts.get(tallyKey) ?? 0) + 1);
  }
  return counts;
}

/** Groups items by key, keeping each group in input order. */
export function groupBy<T>(items: T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    const bucket = groups.get(groupKey);
    if (bucket) bucket.push(item);
    else groups.set(groupKey, [item]);
  }
  return groups;
}

export function first<T>(items: T[], pred: (value: T) => boolean): T | undefined {
  for (const item of items) {
    if (pred(item)) return item;
  }
  return undefined;
}

export function anyMatch<T>(items: T[], pred: (value: T) => boolean): boolean {
  for (const item of items) {
    if (pred(item)) return true;
  }
  return false;
}

export function allMatch<T>(items: T[], pred: (value: T) => boolean): boolean {
  for (const item of items) {
    if (!pred(item)) return false;
  }
  return true;
}

export function sumBy<T>(items: T[], measure: (value: T) => number): number {
  let total = 0;
  for (const item of items) {
    total += measure(item);
  }
  return total;
}

/** Splits items into batches of at most size, the last one shorter. */
export function chunk<T>(items: T[], size: number): Array<T[]> {
  const chunks: Array<T[]> = [];
  if (size <= 0) return chunks;
  let current: T[] = [];
  for (const item of items) {
    current.push(item);
    if (current.length === size) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

/** Returns a copy of items ordered by score, highest first. The sort is stable. */
export function sortedBy<T>(items: T[], score: (value: T) => number): T[] {
  const sorted = [...items];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j > 0 && score(sorted[j - 1]!) < score(sorted[j]!)) {
      const swap = sorted[j]!;
      sorted[j] = sorted[j - 1]!;
      sorted[j - 1] = swap;
      j = j - 1;
    }
  }
  return sorted;
}

/** Drops repeated values, keeping the first of each. */
export function uniqueStrings(values: string[]): string[] {
  const seen = new Map<string, boolean>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.set(value, true);
    out.push(value);
  }
  return out;
}

export function take<T>(items: T[], count: number): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (out.length >= count) break;
    out.push(item);
  }
  return out;
}
