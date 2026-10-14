import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCsatQuota } from "./strict-csat-quota.js";

/** Keeps strict csat quotas by code. */
export interface StrictCsatQuotaStore {
  find(code: string): StrictCsatQuota | undefined;
  save(item: StrictCsatQuota): void;
  remove(code: string): boolean;
  list(): StrictCsatQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCsatQuotaStore implements StrictCsatQuotaStore {
  items: Map<string, StrictCsatQuota>;
  order: string[];

  constructor(items: Map<string, StrictCsatQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCsatQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCsatQuota): void {
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

  list(): StrictCsatQuota[] {
    const out: StrictCsatQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCsatQuotaStore(): StrictCsatQuotaStore {
  return new MemoryStrictCsatQuotaStore(new Map<string, StrictCsatQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCsatQuotaStore implements StrictCsatQuotaStore {
  inner: StrictCsatQuotaStore;
  cache: cache.TtlCache<StrictCsatQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCsatQuotaStore,
    cacheValue: cache.TtlCache<StrictCsatQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCsatQuota | undefined {
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

  save(item: StrictCsatQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCsatQuota[] {
    return this.inner.list();
  }
}

export function newCachedStrictCsatQuotaStore(inner: StrictCsatQuotaStore, ttl: number, clockValue: clock.Clock): StrictCsatQuotaStore {
  return new CachedStrictCsatQuotaStore(inner, cache.newTtlCache<StrictCsatQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects strict csat quotas. Empty fields match all. */
export class StrictCsatQuotaQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCsatQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCsatQuota[]): StrictCsatQuota[] {
    const matched = collections.filter(items, (candidate: StrictCsatQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCsatQuotas(store: StrictCsatQuotaStore, query: StrictCsatQuotaQuery): StrictCsatQuota[] {
  return query.apply(store.list());
}
