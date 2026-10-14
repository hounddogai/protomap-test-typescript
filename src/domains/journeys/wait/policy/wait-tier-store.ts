import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitTier } from "./wait-tier.js";

/** Keeps wait tiers by code. */
export interface WaitTierStore {
  find(code: string): WaitTier | undefined;
  save(item: WaitTier): void;
  remove(code: string): boolean;
  list(): WaitTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitTierStore implements WaitTierStore {
  items: Map<string, WaitTier>;
  order: string[];

  constructor(items: Map<string, WaitTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitTier): void {
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

  list(): WaitTier[] {
    const out: WaitTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitTierStore(): WaitTierStore {
  return new MemoryWaitTierStore(new Map<string, WaitTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitTierStore implements WaitTierStore {
  inner: WaitTierStore;
  cache: cache.TtlCache<WaitTier>;
  hits: number;
  misses: number;

  constructor(inner: WaitTierStore, cacheValue: cache.TtlCache<WaitTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitTier | undefined {
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

  save(item: WaitTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitTier[] {
    return this.inner.list();
  }
}

export function newCachedWaitTierStore(inner: WaitTierStore, ttl: number, clockValue: clock.Clock): WaitTierStore {
  return new CachedWaitTierStore(inner, cache.newTtlCache<WaitTier>(128, ttl, clockValue), 0, 0);
}

/** Selects wait tiers. Empty fields match all. */
export class WaitTierQuery {
  source: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWeight: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitTier): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitTier[]): WaitTier[] {
    const matched = collections.filter(items, (candidate: WaitTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitTiers(store: WaitTierStore, query: WaitTierQuery): WaitTier[] {
  return query.apply(store.list());
}
