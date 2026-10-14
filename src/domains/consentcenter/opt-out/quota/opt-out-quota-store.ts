import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutQuota } from "./opt-out-quota.js";

/** Keeps opt out quotas by code. */
export interface OptOutQuotaStore {
  find(code: string): OptOutQuota | undefined;
  save(item: OptOutQuota): void;
  remove(code: string): boolean;
  list(): OptOutQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutQuotaStore implements OptOutQuotaStore {
  items: Map<string, OptOutQuota>;
  order: string[];

  constructor(items: Map<string, OptOutQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutQuota): void {
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

  list(): OptOutQuota[] {
    const out: OptOutQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutQuotaStore(): OptOutQuotaStore {
  return new MemoryOptOutQuotaStore(new Map<string, OptOutQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutQuotaStore implements OptOutQuotaStore {
  inner: OptOutQuotaStore;
  cache: cache.TtlCache<OptOutQuota>;
  hits: number;
  misses: number;

  constructor(inner: OptOutQuotaStore, cacheValue: cache.TtlCache<OptOutQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutQuota | undefined {
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

  save(item: OptOutQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutQuota[] {
    return this.inner.list();
  }
}

export function newCachedOptOutQuotaStore(inner: OptOutQuotaStore, ttl: number, clockValue: clock.Clock): OptOutQuotaStore {
  return new CachedOptOutQuotaStore(inner, cache.newTtlCache<OptOutQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects opt out quotas. Empty fields match all. */
export class OptOutQuotaQuery {
  utmSource: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minImpressions: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutQuota): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutQuota[]): OptOutQuota[] {
    const matched = collections.filter(items, (candidate: OptOutQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutQuotas(store: OptOutQuotaStore, query: OptOutQuotaQuery): OptOutQuota[] {
  return query.apply(store.list());
}
