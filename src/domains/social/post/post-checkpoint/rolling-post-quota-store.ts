import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPostQuota } from "./rolling-post-quota.js";

/** Keeps rolling post quotas by code. */
export interface RollingPostQuotaStore {
  find(code: string): RollingPostQuota | undefined;
  save(item: RollingPostQuota): void;
  remove(code: string): boolean;
  list(): RollingPostQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPostQuotaStore implements RollingPostQuotaStore {
  items: Map<string, RollingPostQuota>;
  order: string[];

  constructor(items: Map<string, RollingPostQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPostQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPostQuota): void {
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

  list(): RollingPostQuota[] {
    const out: RollingPostQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPostQuotaStore(): RollingPostQuotaStore {
  return new MemoryRollingPostQuotaStore(new Map<string, RollingPostQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPostQuotaStore implements RollingPostQuotaStore {
  inner: RollingPostQuotaStore;
  cache: cache.TtlCache<RollingPostQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPostQuotaStore,
    cacheValue: cache.TtlCache<RollingPostQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPostQuota | undefined {
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

  save(item: RollingPostQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPostQuota[] {
    return this.inner.list();
  }
}

export function newCachedRollingPostQuotaStore(inner: RollingPostQuotaStore, ttl: number, clockValue: clock.Clock): RollingPostQuotaStore {
  return new CachedRollingPostQuotaStore(inner, cache.newTtlCache<RollingPostQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling post quotas. Empty fields match all. */
export class RollingPostQuotaQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPostQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPostQuota[]): RollingPostQuota[] {
    const matched = collections.filter(items, (candidate: RollingPostQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPostQuotas(store: RollingPostQuotaStore, query: RollingPostQuotaQuery): RollingPostQuota[] {
  return query.apply(store.list());
}
