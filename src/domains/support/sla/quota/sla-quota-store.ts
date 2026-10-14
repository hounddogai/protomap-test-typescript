import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaQuota } from "./sla-quota.js";

/** Keeps sla quotas by code. */
export interface SlaQuotaStore {
  find(code: string): SlaQuota | undefined;
  save(item: SlaQuota): void;
  remove(code: string): boolean;
  list(): SlaQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaQuotaStore implements SlaQuotaStore {
  items: Map<string, SlaQuota>;
  order: string[];

  constructor(items: Map<string, SlaQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaQuota): void {
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

  list(): SlaQuota[] {
    const out: SlaQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaQuotaStore(): SlaQuotaStore {
  return new MemorySlaQuotaStore(new Map<string, SlaQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaQuotaStore implements SlaQuotaStore {
  inner: SlaQuotaStore;
  cache: cache.TtlCache<SlaQuota>;
  hits: number;
  misses: number;

  constructor(inner: SlaQuotaStore, cacheValue: cache.TtlCache<SlaQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaQuota | undefined {
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

  save(item: SlaQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaQuota[] {
    return this.inner.list();
  }
}

export function newCachedSlaQuotaStore(inner: SlaQuotaStore, ttl: number, clockValue: clock.Clock): SlaQuotaStore {
  return new CachedSlaQuotaStore(inner, cache.newTtlCache<SlaQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects sla quotas. Empty fields match all. */
export class SlaQuotaQuery {
  country: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minScore: number, statuses: string[], limit: number) {
    this.country = country;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaQuota): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaQuota[]): SlaQuota[] {
    const matched = collections.filter(items, (candidate: SlaQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaQuotas(store: SlaQuotaStore, query: SlaQuotaQuery): SlaQuota[] {
  return query.apply(store.list());
}
