import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingLevelQuota } from "./pending-level-quota.js";

/** Keeps pending level quotas by code. */
export interface PendingLevelQuotaStore {
  find(code: string): PendingLevelQuota | undefined;
  save(item: PendingLevelQuota): void;
  remove(code: string): boolean;
  list(): PendingLevelQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingLevelQuotaStore implements PendingLevelQuotaStore {
  items: Map<string, PendingLevelQuota>;
  order: string[];

  constructor(items: Map<string, PendingLevelQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingLevelQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingLevelQuota): void {
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

  list(): PendingLevelQuota[] {
    const out: PendingLevelQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingLevelQuotaStore(): PendingLevelQuotaStore {
  return new MemoryPendingLevelQuotaStore(new Map<string, PendingLevelQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingLevelQuotaStore implements PendingLevelQuotaStore {
  inner: PendingLevelQuotaStore;
  cache: cache.TtlCache<PendingLevelQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingLevelQuotaStore,
    cacheValue: cache.TtlCache<PendingLevelQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingLevelQuota | undefined {
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

  save(item: PendingLevelQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingLevelQuota[] {
    return this.inner.list();
  }
}

export function newCachedPendingLevelQuotaStore(inner: PendingLevelQuotaStore, ttl: number, clockValue: clock.Clock): PendingLevelQuotaStore {
  return new CachedPendingLevelQuotaStore(inner, cache.newTtlCache<PendingLevelQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects pending level quotas. Empty fields match all. */
export class PendingLevelQuotaQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingLevelQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingLevelQuota[]): PendingLevelQuota[] {
    const matched = collections.filter(items, (candidate: PendingLevelQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingLevelQuotas(store: PendingLevelQuotaStore, query: PendingLevelQuotaQuery): PendingLevelQuota[] {
  return query.apply(store.list());
}
