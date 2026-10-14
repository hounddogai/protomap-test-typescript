import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditAdjustment } from "./credit-adjustment.js";

/** Keeps credit adjustments by code. */
export interface CreditAdjustmentStore {
  find(code: string): CreditAdjustment | undefined;
  save(item: CreditAdjustment): void;
  remove(code: string): boolean;
  list(): CreditAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditAdjustmentStore implements CreditAdjustmentStore {
  items: Map<string, CreditAdjustment>;
  order: string[];

  constructor(items: Map<string, CreditAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditAdjustment): void {
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

  list(): CreditAdjustment[] {
    const out: CreditAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditAdjustmentStore(): CreditAdjustmentStore {
  return new MemoryCreditAdjustmentStore(new Map<string, CreditAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditAdjustmentStore implements CreditAdjustmentStore {
  inner: CreditAdjustmentStore;
  cache: cache.TtlCache<CreditAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditAdjustmentStore,
    cacheValue: cache.TtlCache<CreditAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditAdjustment | undefined {
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

  save(item: CreditAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedCreditAdjustmentStore(inner: CreditAdjustmentStore, ttl: number, clockValue: clock.Clock): CreditAdjustmentStore {
  return new CachedCreditAdjustmentStore(inner, cache.newTtlCache<CreditAdjustment>(512, ttl, clockValue), 0, 0);
}

/** Selects credit adjustments. Empty fields match all. */
export class CreditAdjustmentQuery {
  region: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditAdjustment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditAdjustment[]): CreditAdjustment[] {
    const matched = collections.filter(items, (candidate: CreditAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditAdjustments(store: CreditAdjustmentStore, query: CreditAdjustmentQuery): CreditAdjustment[] {
  return query.apply(store.list());
}
