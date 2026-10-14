import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierEntry } from "./tier-entry.js";

/** Keeps tier entries by code. */
export interface TierEntryStore {
  find(code: string): TierEntry | undefined;
  save(item: TierEntry): void;
  remove(code: string): boolean;
  list(): TierEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierEntryStore implements TierEntryStore {
  items: Map<string, TierEntry>;
  order: string[];

  constructor(items: Map<string, TierEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierEntry): void {
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

  list(): TierEntry[] {
    const out: TierEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierEntryStore(): TierEntryStore {
  return new MemoryTierEntryStore(new Map<string, TierEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierEntryStore implements TierEntryStore {
  inner: TierEntryStore;
  cache: cache.TtlCache<TierEntry>;
  hits: number;
  misses: number;

  constructor(inner: TierEntryStore, cacheValue: cache.TtlCache<TierEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierEntry | undefined {
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

  save(item: TierEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierEntry[] {
    return this.inner.list();
  }
}

export function newCachedTierEntryStore(inner: TierEntryStore, ttl: number, clockValue: clock.Clock): TierEntryStore {
  return new CachedTierEntryStore(inner, cache.newTtlCache<TierEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects tier entries. Empty fields match all. */
export class TierEntryQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierEntry): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierEntry[]): TierEntry[] {
    const matched = collections.filter(items, (candidate: TierEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierEntries(store: TierEntryStore, query: TierEntryQuery): TierEntry[] {
  return query.apply(store.list());
}
