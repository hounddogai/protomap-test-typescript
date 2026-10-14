import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckQuota } from "./fraud-check-quota.js";

/** Keeps fraud check quotas by code. */
export interface FraudCheckQuotaStore {
  find(code: string): FraudCheckQuota | undefined;
  save(item: FraudCheckQuota): void;
  remove(code: string): boolean;
  list(): FraudCheckQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckQuotaStore implements FraudCheckQuotaStore {
  items: Map<string, FraudCheckQuota>;
  order: string[];

  constructor(items: Map<string, FraudCheckQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckQuota): void {
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

  list(): FraudCheckQuota[] {
    const out: FraudCheckQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckQuotaStore(): FraudCheckQuotaStore {
  return new MemoryFraudCheckQuotaStore(new Map<string, FraudCheckQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckQuotaStore implements FraudCheckQuotaStore {
  inner: FraudCheckQuotaStore;
  cache: cache.TtlCache<FraudCheckQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckQuotaStore,
    cacheValue: cache.TtlCache<FraudCheckQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckQuota | undefined {
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

  save(item: FraudCheckQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckQuota[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckQuotaStore(inner: FraudCheckQuotaStore, ttl: number, clockValue: clock.Clock): FraudCheckQuotaStore {
  return new CachedFraudCheckQuotaStore(inner, cache.newTtlCache<FraudCheckQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check quotas. Empty fields match all. */
export class FraudCheckQuotaQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckQuota[]): FraudCheckQuota[] {
    const matched = collections.filter(items, (candidate: FraudCheckQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckQuotas(store: FraudCheckQuotaStore, query: FraudCheckQuotaQuery): FraudCheckQuota[] {
  return query.apply(store.list());
}
