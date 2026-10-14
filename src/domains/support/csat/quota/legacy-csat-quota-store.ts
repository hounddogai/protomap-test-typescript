import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCsatQuota } from "./legacy-csat-quota.js";

/** Keeps legacy csat quotas by code. */
export interface LegacyCsatQuotaStore {
  find(code: string): LegacyCsatQuota | undefined;
  save(item: LegacyCsatQuota): void;
  remove(code: string): boolean;
  list(): LegacyCsatQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCsatQuotaStore implements LegacyCsatQuotaStore {
  items: Map<string, LegacyCsatQuota>;
  order: string[];

  constructor(items: Map<string, LegacyCsatQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCsatQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCsatQuota): void {
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

  list(): LegacyCsatQuota[] {
    const out: LegacyCsatQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCsatQuotaStore(): LegacyCsatQuotaStore {
  return new MemoryLegacyCsatQuotaStore(new Map<string, LegacyCsatQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCsatQuotaStore implements LegacyCsatQuotaStore {
  inner: LegacyCsatQuotaStore;
  cache: cache.TtlCache<LegacyCsatQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCsatQuotaStore,
    cacheValue: cache.TtlCache<LegacyCsatQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCsatQuota | undefined {
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

  save(item: LegacyCsatQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCsatQuota[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCsatQuotaStore(inner: LegacyCsatQuotaStore, ttl: number, clockValue: clock.Clock): LegacyCsatQuotaStore {
  return new CachedLegacyCsatQuotaStore(inner, cache.newTtlCache<LegacyCsatQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects legacy csat quotas. Empty fields match all. */
export class LegacyCsatQuotaQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCsatQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCsatQuota[]): LegacyCsatQuota[] {
    const matched = collections.filter(items, (candidate: LegacyCsatQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCsatQuotas(store: LegacyCsatQuotaStore, query: LegacyCsatQuotaQuery): LegacyCsatQuota[] {
  return query.apply(store.list());
}
