import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionQuota } from "./conversion-quota.js";

/** Keeps conversion quotas by code. */
export interface ConversionQuotaStore {
  find(code: string): ConversionQuota | undefined;
  save(item: ConversionQuota): void;
  remove(code: string): boolean;
  list(): ConversionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionQuotaStore implements ConversionQuotaStore {
  items: Map<string, ConversionQuota>;
  order: string[];

  constructor(items: Map<string, ConversionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionQuota): void {
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

  list(): ConversionQuota[] {
    const out: ConversionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionQuotaStore(): ConversionQuotaStore {
  return new MemoryConversionQuotaStore(new Map<string, ConversionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionQuotaStore implements ConversionQuotaStore {
  inner: ConversionQuotaStore;
  cache: cache.TtlCache<ConversionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionQuotaStore,
    cacheValue: cache.TtlCache<ConversionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionQuota | undefined {
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

  save(item: ConversionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionQuota[] {
    return this.inner.list();
  }
}

export function newCachedConversionQuotaStore(inner: ConversionQuotaStore, ttl: number, clockValue: clock.Clock): ConversionQuotaStore {
  return new CachedConversionQuotaStore(inner, cache.newTtlCache<ConversionQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects conversion quotas. Empty fields match all. */
export class ConversionQuotaQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionQuota[]): ConversionQuota[] {
    const matched = collections.filter(items, (candidate: ConversionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionQuotas(store: ConversionQuotaStore, query: ConversionQuotaQuery): ConversionQuota[] {
  return query.apply(store.list());
}
