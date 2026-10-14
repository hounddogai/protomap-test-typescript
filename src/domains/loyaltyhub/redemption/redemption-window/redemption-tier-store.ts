import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionTier } from "./redemption-tier.js";

/** Keeps redemption tiers by code. */
export interface RedemptionTierStore {
  find(code: string): RedemptionTier | undefined;
  save(item: RedemptionTier): void;
  remove(code: string): boolean;
  list(): RedemptionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionTierStore implements RedemptionTierStore {
  items: Map<string, RedemptionTier>;
  order: string[];

  constructor(items: Map<string, RedemptionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionTier): void {
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

  list(): RedemptionTier[] {
    const out: RedemptionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionTierStore(): RedemptionTierStore {
  return new MemoryRedemptionTierStore(new Map<string, RedemptionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionTierStore implements RedemptionTierStore {
  inner: RedemptionTierStore;
  cache: cache.TtlCache<RedemptionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionTierStore,
    cacheValue: cache.TtlCache<RedemptionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionTier | undefined {
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

  save(item: RedemptionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionTier[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionTierStore(inner: RedemptionTierStore, ttl: number, clockValue: clock.Clock): RedemptionTierStore {
  return new CachedRedemptionTierStore(inner, cache.newTtlCache<RedemptionTier>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption tiers. Empty fields match all. */
export class RedemptionTierQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionTier[]): RedemptionTier[] {
    const matched = collections.filter(items, (candidate: RedemptionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionTiers(store: RedemptionTierStore, query: RedemptionTierQuery): RedemptionTier[] {
  return query.apply(store.list());
}
