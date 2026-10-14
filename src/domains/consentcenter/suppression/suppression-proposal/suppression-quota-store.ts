import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionQuota } from "./suppression-quota.js";

/** Keeps suppression quotas by code. */
export interface SuppressionQuotaStore {
  find(code: string): SuppressionQuota | undefined;
  save(item: SuppressionQuota): void;
  remove(code: string): boolean;
  list(): SuppressionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionQuotaStore implements SuppressionQuotaStore {
  items: Map<string, SuppressionQuota>;
  order: string[];

  constructor(items: Map<string, SuppressionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionQuota): void {
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

  list(): SuppressionQuota[] {
    const out: SuppressionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionQuotaStore(): SuppressionQuotaStore {
  return new MemorySuppressionQuotaStore(new Map<string, SuppressionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionQuotaStore implements SuppressionQuotaStore {
  inner: SuppressionQuotaStore;
  cache: cache.TtlCache<SuppressionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionQuotaStore,
    cacheValue: cache.TtlCache<SuppressionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionQuota | undefined {
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

  save(item: SuppressionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionQuota[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionQuotaStore(inner: SuppressionQuotaStore, ttl: number, clockValue: clock.Clock): SuppressionQuotaStore {
  return new CachedSuppressionQuotaStore(inner, cache.newTtlCache<SuppressionQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects suppression quotas. Empty fields match all. */
export class SuppressionQuotaQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionQuota[]): SuppressionQuota[] {
    const matched = collections.filter(items, (candidate: SuppressionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionQuotas(store: SuppressionQuotaStore, query: SuppressionQuotaQuery): SuppressionQuota[] {
  return query.apply(store.list());
}
