import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

/** Keeps rolling fraud check tiers by code. */
export interface RollingFraudCheckTierStore {
  find(code: string): RollingFraudCheckTier | undefined;
  save(item: RollingFraudCheckTier): void;
  remove(code: string): boolean;
  list(): RollingFraudCheckTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFraudCheckTierStore implements RollingFraudCheckTierStore {
  items: Map<string, RollingFraudCheckTier>;
  order: string[];

  constructor(items: Map<string, RollingFraudCheckTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFraudCheckTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFraudCheckTier): void {
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

  list(): RollingFraudCheckTier[] {
    const out: RollingFraudCheckTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFraudCheckTierStore(): RollingFraudCheckTierStore {
  return new MemoryRollingFraudCheckTierStore(new Map<string, RollingFraudCheckTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFraudCheckTierStore implements RollingFraudCheckTierStore {
  inner: RollingFraudCheckTierStore;
  cache: cache.TtlCache<RollingFraudCheckTier>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFraudCheckTierStore,
    cacheValue: cache.TtlCache<RollingFraudCheckTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFraudCheckTier | undefined {
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

  save(item: RollingFraudCheckTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFraudCheckTier[] {
    return this.inner.list();
  }
}

export function newCachedRollingFraudCheckTierStore(inner: RollingFraudCheckTierStore, ttl: number, clockValue: clock.Clock): RollingFraudCheckTierStore {
  return new CachedRollingFraudCheckTierStore(
    inner,
    cache.newTtlCache<RollingFraudCheckTier>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling fraud check tiers. Empty fields match all. */
export class RollingFraudCheckTierQuery {
  category: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCeiling: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFraudCheckTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFraudCheckTier[]): RollingFraudCheckTier[] {
    const matched = collections.filter(items, (candidate: RollingFraudCheckTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFraudCheckTiers(store: RollingFraudCheckTierStore, query: RollingFraudCheckTierQuery): RollingFraudCheckTier[] {
  return query.apply(store.list());
}
