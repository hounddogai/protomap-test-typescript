import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightQuota } from "./insight-quota.js";

/** Keeps insight quotas by code. */
export interface InsightQuotaStore {
  find(code: string): InsightQuota | undefined;
  save(item: InsightQuota): void;
  remove(code: string): boolean;
  list(): InsightQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightQuotaStore implements InsightQuotaStore {
  items: Map<string, InsightQuota>;
  order: string[];

  constructor(items: Map<string, InsightQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightQuota): void {
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

  list(): InsightQuota[] {
    const out: InsightQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightQuotaStore(): InsightQuotaStore {
  return new MemoryInsightQuotaStore(new Map<string, InsightQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightQuotaStore implements InsightQuotaStore {
  inner: InsightQuotaStore;
  cache: cache.TtlCache<InsightQuota>;
  hits: number;
  misses: number;

  constructor(inner: InsightQuotaStore, cacheValue: cache.TtlCache<InsightQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightQuota | undefined {
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

  save(item: InsightQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightQuota[] {
    return this.inner.list();
  }
}

export function newCachedInsightQuotaStore(inner: InsightQuotaStore, ttl: number, clockValue: clock.Clock): InsightQuotaStore {
  return new CachedInsightQuotaStore(inner, cache.newTtlCache<InsightQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects insight quotas. Empty fields match all. */
export class InsightQuotaQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightQuota): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightQuota[]): InsightQuota[] {
    const matched = collections.filter(items, (candidate: InsightQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightQuotas(store: InsightQuotaStore, query: InsightQuotaQuery): InsightQuota[] {
  return query.apply(store.list());
}
