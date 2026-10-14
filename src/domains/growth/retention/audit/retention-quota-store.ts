import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionQuota } from "./retention-quota.js";

/** Keeps retention quotas by code. */
export interface RetentionQuotaStore {
  find(code: string): RetentionQuota | undefined;
  save(item: RetentionQuota): void;
  remove(code: string): boolean;
  list(): RetentionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionQuotaStore implements RetentionQuotaStore {
  items: Map<string, RetentionQuota>;
  order: string[];

  constructor(items: Map<string, RetentionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionQuota): void {
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

  list(): RetentionQuota[] {
    const out: RetentionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionQuotaStore(): RetentionQuotaStore {
  return new MemoryRetentionQuotaStore(new Map<string, RetentionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionQuotaStore implements RetentionQuotaStore {
  inner: RetentionQuotaStore;
  cache: cache.TtlCache<RetentionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionQuotaStore,
    cacheValue: cache.TtlCache<RetentionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionQuota | undefined {
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

  save(item: RetentionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionQuota[] {
    return this.inner.list();
  }
}

export function newCachedRetentionQuotaStore(inner: RetentionQuotaStore, ttl: number, clockValue: clock.Clock): RetentionQuotaStore {
  return new CachedRetentionQuotaStore(inner, cache.newTtlCache<RetentionQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects retention quotas. Empty fields match all. */
export class RetentionQuotaQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionQuota[]): RetentionQuota[] {
    const matched = collections.filter(items, (candidate: RetentionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionQuotas(store: RetentionQuotaStore, query: RetentionQuotaQuery): RetentionQuota[] {
  return query.apply(store.list());
}
