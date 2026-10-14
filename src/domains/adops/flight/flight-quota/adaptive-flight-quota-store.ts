import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFlightQuota } from "./adaptive-flight-quota.js";

/** Keeps adaptive flight quotas by code. */
export interface AdaptiveFlightQuotaStore {
  find(code: string): AdaptiveFlightQuota | undefined;
  save(item: AdaptiveFlightQuota): void;
  remove(code: string): boolean;
  list(): AdaptiveFlightQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFlightQuotaStore implements AdaptiveFlightQuotaStore {
  items: Map<string, AdaptiveFlightQuota>;
  order: string[];

  constructor(items: Map<string, AdaptiveFlightQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFlightQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFlightQuota): void {
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

  list(): AdaptiveFlightQuota[] {
    const out: AdaptiveFlightQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFlightQuotaStore(): AdaptiveFlightQuotaStore {
  return new MemoryAdaptiveFlightQuotaStore(new Map<string, AdaptiveFlightQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFlightQuotaStore implements AdaptiveFlightQuotaStore {
  inner: AdaptiveFlightQuotaStore;
  cache: cache.TtlCache<AdaptiveFlightQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFlightQuotaStore,
    cacheValue: cache.TtlCache<AdaptiveFlightQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFlightQuota | undefined {
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

  save(item: AdaptiveFlightQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFlightQuota[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFlightQuotaStore(inner: AdaptiveFlightQuotaStore, ttl: number, clockValue: clock.Clock): AdaptiveFlightQuotaStore {
  return new CachedAdaptiveFlightQuotaStore(inner, cache.newTtlCache<AdaptiveFlightQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects adaptive flight quotas. Empty fields match all. */
export class AdaptiveFlightQuotaQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFlightQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFlightQuota[]): AdaptiveFlightQuota[] {
    const matched = collections.filter(items, (candidate: AdaptiveFlightQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFlightQuotas(store: AdaptiveFlightQuotaStore, query: AdaptiveFlightQuotaQuery): AdaptiveFlightQuota[] {
  return query.apply(store.list());
}
