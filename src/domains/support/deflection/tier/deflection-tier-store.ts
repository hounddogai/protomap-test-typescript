import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionTier } from "./deflection-tier.js";

/** Keeps deflection tiers by code. */
export interface DeflectionTierStore {
  find(code: string): DeflectionTier | undefined;
  save(item: DeflectionTier): void;
  remove(code: string): boolean;
  list(): DeflectionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionTierStore implements DeflectionTierStore {
  items: Map<string, DeflectionTier>;
  order: string[];

  constructor(items: Map<string, DeflectionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionTier): void {
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

  list(): DeflectionTier[] {
    const out: DeflectionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionTierStore(): DeflectionTierStore {
  return new MemoryDeflectionTierStore(new Map<string, DeflectionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionTierStore implements DeflectionTierStore {
  inner: DeflectionTierStore;
  cache: cache.TtlCache<DeflectionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionTierStore,
    cacheValue: cache.TtlCache<DeflectionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionTier | undefined {
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

  save(item: DeflectionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionTier[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionTierStore(inner: DeflectionTierStore, ttl: number, clockValue: clock.Clock): DeflectionTierStore {
  return new CachedDeflectionTierStore(inner, cache.newTtlCache<DeflectionTier>(128, ttl, clockValue), 0, 0);
}

/** Selects deflection tiers. Empty fields match all. */
export class DeflectionTierQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionTier[]): DeflectionTier[] {
    const matched = collections.filter(items, (candidate: DeflectionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionTiers(store: DeflectionTierStore, query: DeflectionTierQuery): DeflectionTier[] {
  return query.apply(store.list());
}
