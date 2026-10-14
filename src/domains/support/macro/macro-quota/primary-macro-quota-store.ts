import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryMacroQuota } from "./primary-macro-quota.js";

/** Keeps primary macro quotas by code. */
export interface PrimaryMacroQuotaStore {
  find(code: string): PrimaryMacroQuota | undefined;
  save(item: PrimaryMacroQuota): void;
  remove(code: string): boolean;
  list(): PrimaryMacroQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryMacroQuotaStore implements PrimaryMacroQuotaStore {
  items: Map<string, PrimaryMacroQuota>;
  order: string[];

  constructor(items: Map<string, PrimaryMacroQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryMacroQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryMacroQuota): void {
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

  list(): PrimaryMacroQuota[] {
    const out: PrimaryMacroQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryMacroQuotaStore(): PrimaryMacroQuotaStore {
  return new MemoryPrimaryMacroQuotaStore(new Map<string, PrimaryMacroQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryMacroQuotaStore implements PrimaryMacroQuotaStore {
  inner: PrimaryMacroQuotaStore;
  cache: cache.TtlCache<PrimaryMacroQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryMacroQuotaStore,
    cacheValue: cache.TtlCache<PrimaryMacroQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryMacroQuota | undefined {
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

  save(item: PrimaryMacroQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryMacroQuota[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryMacroQuotaStore(inner: PrimaryMacroQuotaStore, ttl: number, clockValue: clock.Clock): PrimaryMacroQuotaStore {
  return new CachedPrimaryMacroQuotaStore(inner, cache.newTtlCache<PrimaryMacroQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary macro quotas. Empty fields match all. */
export class PrimaryMacroQuotaQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryMacroQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryMacroQuota[]): PrimaryMacroQuota[] {
    const matched = collections.filter(items, (candidate: PrimaryMacroQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryMacroQuotas(store: PrimaryMacroQuotaStore, query: PrimaryMacroQuotaQuery): PrimaryMacroQuota[] {
  return query.apply(store.list());
}
