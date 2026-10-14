import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionQuota } from "./deflection-quota.js";

/** Keeps deflection quotas by code. */
export interface DeflectionQuotaStore {
  find(code: string): DeflectionQuota | undefined;
  save(item: DeflectionQuota): void;
  remove(code: string): boolean;
  list(): DeflectionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionQuotaStore implements DeflectionQuotaStore {
  items: Map<string, DeflectionQuota>;
  order: string[];

  constructor(items: Map<string, DeflectionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionQuota): void {
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

  list(): DeflectionQuota[] {
    const out: DeflectionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionQuotaStore(): DeflectionQuotaStore {
  return new MemoryDeflectionQuotaStore(new Map<string, DeflectionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionQuotaStore implements DeflectionQuotaStore {
  inner: DeflectionQuotaStore;
  cache: cache.TtlCache<DeflectionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionQuotaStore,
    cacheValue: cache.TtlCache<DeflectionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionQuota | undefined {
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

  save(item: DeflectionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionQuota[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionQuotaStore(inner: DeflectionQuotaStore, ttl: number, clockValue: clock.Clock): DeflectionQuotaStore {
  return new CachedDeflectionQuotaStore(inner, cache.newTtlCache<DeflectionQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection quotas. Empty fields match all. */
export class DeflectionQuotaQuery {
  source: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minOpenRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionQuota): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionQuota[]): DeflectionQuota[] {
    const matched = collections.filter(items, (candidate: DeflectionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionQuotas(store: DeflectionQuotaStore, query: DeflectionQuotaQuery): DeflectionQuota[] {
  return query.apply(store.list());
}
