import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierItem } from "./tier-item.js";

/** Keeps tier items by code. */
export interface TierItemStore {
  find(code: string): TierItem | undefined;
  save(item: TierItem): void;
  remove(code: string): boolean;
  list(): TierItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierItemStore implements TierItemStore {
  items: Map<string, TierItem>;
  order: string[];

  constructor(items: Map<string, TierItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierItem): void {
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

  list(): TierItem[] {
    const out: TierItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierItemStore(): TierItemStore {
  return new MemoryTierItemStore(new Map<string, TierItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierItemStore implements TierItemStore {
  inner: TierItemStore;
  cache: cache.TtlCache<TierItem>;
  hits: number;
  misses: number;

  constructor(inner: TierItemStore, cacheValue: cache.TtlCache<TierItem>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierItem | undefined {
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

  save(item: TierItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierItem[] {
    return this.inner.list();
  }
}

export function newCachedTierItemStore(inner: TierItemStore, ttl: number, clockValue: clock.Clock): TierItemStore {
  return new CachedTierItemStore(inner, cache.newTtlCache<TierItem>(256, ttl, clockValue), 0, 0);
}

/** Selects tier items. Empty fields match all. */
export class TierItemQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierItem): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierItem[]): TierItem[] {
    const matched = collections.filter(items, (candidate: TierItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierItems(store: TierItemStore, query: TierItemQuery): TierItem[] {
  return query.apply(store.list());
}
