import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckTier } from "./fraud-check-tier.js";

/** Keeps fraud check tiers by code. */
export interface FraudCheckTierStore {
  find(code: string): FraudCheckTier | undefined;
  save(item: FraudCheckTier): void;
  remove(code: string): boolean;
  list(): FraudCheckTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckTierStore implements FraudCheckTierStore {
  items: Map<string, FraudCheckTier>;
  order: string[];

  constructor(items: Map<string, FraudCheckTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckTier): void {
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

  list(): FraudCheckTier[] {
    const out: FraudCheckTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckTierStore(): FraudCheckTierStore {
  return new MemoryFraudCheckTierStore(new Map<string, FraudCheckTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckTierStore implements FraudCheckTierStore {
  inner: FraudCheckTierStore;
  cache: cache.TtlCache<FraudCheckTier>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckTierStore,
    cacheValue: cache.TtlCache<FraudCheckTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckTier | undefined {
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

  save(item: FraudCheckTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckTier[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckTierStore(inner: FraudCheckTierStore, ttl: number, clockValue: clock.Clock): FraudCheckTierStore {
  return new CachedFraudCheckTierStore(inner, cache.newTtlCache<FraudCheckTier>(512, ttl, clockValue), 0, 0);
}

/** Selects fraud check tiers. Empty fields match all. */
export class FraudCheckTierQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckTier[]): FraudCheckTier[] {
    const matched = collections.filter(items, (candidate: FraudCheckTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckTiers(store: FraudCheckTierStore, query: FraudCheckTierQuery): FraudCheckTier[] {
  return query.apply(store.list());
}
