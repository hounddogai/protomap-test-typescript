import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedDeflectionEntry } from "./weighted-deflection-entry.js";

/** Keeps weighted deflection entries by code. */
export interface WeightedDeflectionEntryStore {
  find(code: string): WeightedDeflectionEntry | undefined;
  save(item: WeightedDeflectionEntry): void;
  remove(code: string): boolean;
  list(): WeightedDeflectionEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedDeflectionEntryStore implements WeightedDeflectionEntryStore {
  items: Map<string, WeightedDeflectionEntry>;
  order: string[];

  constructor(items: Map<string, WeightedDeflectionEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedDeflectionEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedDeflectionEntry): void {
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

  list(): WeightedDeflectionEntry[] {
    const out: WeightedDeflectionEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedDeflectionEntryStore(): WeightedDeflectionEntryStore {
  return new MemoryWeightedDeflectionEntryStore(new Map<string, WeightedDeflectionEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedDeflectionEntryStore implements WeightedDeflectionEntryStore {
  inner: WeightedDeflectionEntryStore;
  cache: cache.TtlCache<WeightedDeflectionEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedDeflectionEntryStore,
    cacheValue: cache.TtlCache<WeightedDeflectionEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedDeflectionEntry | undefined {
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

  save(item: WeightedDeflectionEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedDeflectionEntry[] {
    return this.inner.list();
  }
}

export function newCachedWeightedDeflectionEntryStore(inner: WeightedDeflectionEntryStore, ttl: number, clockValue: clock.Clock): WeightedDeflectionEntryStore {
  return new CachedWeightedDeflectionEntryStore(
    inner,
    cache.newTtlCache<WeightedDeflectionEntry>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted deflection entries. Empty fields match all. */
export class WeightedDeflectionEntryQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedDeflectionEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedDeflectionEntry[]): WeightedDeflectionEntry[] {
    const matched = collections.filter(items, (candidate: WeightedDeflectionEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedDeflectionEntries(store: WeightedDeflectionEntryStore, query: WeightedDeflectionEntryQuery): WeightedDeflectionEntry[] {
  return query.apply(store.list());
}
