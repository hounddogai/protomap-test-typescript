import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedSenderQuota } from "./weighted-sender-quota.js";

/** Keeps weighted sender quotas by code. */
export interface WeightedSenderQuotaStore {
  find(code: string): WeightedSenderQuota | undefined;
  save(item: WeightedSenderQuota): void;
  remove(code: string): boolean;
  list(): WeightedSenderQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedSenderQuotaStore implements WeightedSenderQuotaStore {
  items: Map<string, WeightedSenderQuota>;
  order: string[];

  constructor(items: Map<string, WeightedSenderQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedSenderQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedSenderQuota): void {
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

  list(): WeightedSenderQuota[] {
    const out: WeightedSenderQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedSenderQuotaStore(): WeightedSenderQuotaStore {
  return new MemoryWeightedSenderQuotaStore(new Map<string, WeightedSenderQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedSenderQuotaStore implements WeightedSenderQuotaStore {
  inner: WeightedSenderQuotaStore;
  cache: cache.TtlCache<WeightedSenderQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedSenderQuotaStore,
    cacheValue: cache.TtlCache<WeightedSenderQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedSenderQuota | undefined {
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

  save(item: WeightedSenderQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedSenderQuota[] {
    return this.inner.list();
  }
}

export function newCachedWeightedSenderQuotaStore(inner: WeightedSenderQuotaStore, ttl: number, clockValue: clock.Clock): WeightedSenderQuotaStore {
  return new CachedWeightedSenderQuotaStore(inner, cache.newTtlCache<WeightedSenderQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted sender quotas. Empty fields match all. */
export class WeightedSenderQuotaQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedSenderQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedSenderQuota[]): WeightedSenderQuota[] {
    const matched = collections.filter(items, (candidate: WeightedSenderQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedSenderQuotas(store: WeightedSenderQuotaStore, query: WeightedSenderQuotaQuery): WeightedSenderQuota[] {
  return query.apply(store.list());
}
