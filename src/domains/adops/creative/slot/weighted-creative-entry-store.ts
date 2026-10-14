import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCreativeEntry } from "./weighted-creative-entry.js";

/** Keeps weighted creative entries by code. */
export interface WeightedCreativeEntryStore {
  find(code: string): WeightedCreativeEntry | undefined;
  save(item: WeightedCreativeEntry): void;
  remove(code: string): boolean;
  list(): WeightedCreativeEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCreativeEntryStore implements WeightedCreativeEntryStore {
  items: Map<string, WeightedCreativeEntry>;
  order: string[];

  constructor(items: Map<string, WeightedCreativeEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCreativeEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCreativeEntry): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): WeightedCreativeEntry[] {
    const out: WeightedCreativeEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCreativeEntryStore(): WeightedCreativeEntryStore {
  return new MemoryWeightedCreativeEntryStore(new Map<string, WeightedCreativeEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCreativeEntryStore implements WeightedCreativeEntryStore {
  inner: WeightedCreativeEntryStore;
  cache: cache.TtlCache<WeightedCreativeEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCreativeEntryStore,
    cacheValue: cache.TtlCache<WeightedCreativeEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCreativeEntry | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: WeightedCreativeEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCreativeEntry[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCreativeEntryStore(inner: WeightedCreativeEntryStore, ttl: number, clockValue: clock.Clock): WeightedCreativeEntryStore {
  return new CachedWeightedCreativeEntryStore(
    inner,
    cache.newTtlCache<WeightedCreativeEntry>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted creative entries. Empty fields match all. */
export class WeightedCreativeEntryQuery {
  utmSource: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minEndsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCreativeEntry): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCreativeEntry[]): WeightedCreativeEntry[] {
    const matched = collections.filter(items, (candidate: WeightedCreativeEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCreativeEntries(store: WeightedCreativeEntryStore, query: WeightedCreativeEntryQuery): WeightedCreativeEntry[] {
  return query.apply(store.list());
}
