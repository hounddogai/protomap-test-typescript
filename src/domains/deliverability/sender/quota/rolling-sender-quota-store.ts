import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSenderQuota } from "./rolling-sender-quota.js";

/** Keeps rolling sender quotas by code. */
export interface RollingSenderQuotaStore {
  find(code: string): RollingSenderQuota | undefined;
  save(item: RollingSenderQuota): void;
  remove(code: string): boolean;
  list(): RollingSenderQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSenderQuotaStore implements RollingSenderQuotaStore {
  items: Map<string, RollingSenderQuota>;
  order: string[];

  constructor(items: Map<string, RollingSenderQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSenderQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSenderQuota): void {
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

  list(): RollingSenderQuota[] {
    const out: RollingSenderQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSenderQuotaStore(): RollingSenderQuotaStore {
  return new MemoryRollingSenderQuotaStore(new Map<string, RollingSenderQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSenderQuotaStore implements RollingSenderQuotaStore {
  inner: RollingSenderQuotaStore;
  cache: cache.TtlCache<RollingSenderQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSenderQuotaStore,
    cacheValue: cache.TtlCache<RollingSenderQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSenderQuota | undefined {
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

  save(item: RollingSenderQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSenderQuota[] {
    return this.inner.list();
  }
}

export function newCachedRollingSenderQuotaStore(inner: RollingSenderQuotaStore, ttl: number, clockValue: clock.Clock): RollingSenderQuotaStore {
  return new CachedRollingSenderQuotaStore(inner, cache.newTtlCache<RollingSenderQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling sender quotas. Empty fields match all. */
export class RollingSenderQuotaQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSenderQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSenderQuota[]): RollingSenderQuota[] {
    const matched = collections.filter(items, (candidate: RollingSenderQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSenderQuotas(store: RollingSenderQuotaStore, query: RollingSenderQuotaQuery): RollingSenderQuota[] {
  return query.apply(store.list());
}
