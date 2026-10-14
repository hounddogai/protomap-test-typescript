import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardEntry } from "./weighted-reward-entry.js";

/** Keeps weighted reward entries by code. */
export interface WeightedRewardEntryStore {
  find(code: string): WeightedRewardEntry | undefined;
  save(item: WeightedRewardEntry): void;
  remove(code: string): boolean;
  list(): WeightedRewardEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardEntryStore implements WeightedRewardEntryStore {
  items: Map<string, WeightedRewardEntry>;
  order: string[];

  constructor(items: Map<string, WeightedRewardEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardEntry): void {
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

  list(): WeightedRewardEntry[] {
    const out: WeightedRewardEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardEntryStore(): WeightedRewardEntryStore {
  return new MemoryWeightedRewardEntryStore(new Map<string, WeightedRewardEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardEntryStore implements WeightedRewardEntryStore {
  inner: WeightedRewardEntryStore;
  cache: cache.TtlCache<WeightedRewardEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardEntryStore,
    cacheValue: cache.TtlCache<WeightedRewardEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardEntry | undefined {
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

  save(item: WeightedRewardEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardEntry[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardEntryStore(inner: WeightedRewardEntryStore, ttl: number, clockValue: clock.Clock): WeightedRewardEntryStore {
  return new CachedWeightedRewardEntryStore(inner, cache.newTtlCache<WeightedRewardEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects weighted reward entries. Empty fields match all. */
export class WeightedRewardEntryQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardEntry[]): WeightedRewardEntry[] {
    const matched = collections.filter(items, (candidate: WeightedRewardEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardEntries(store: WeightedRewardEntryStore, query: WeightedRewardEntryQuery): WeightedRewardEntry[] {
  return query.apply(store.list());
}
