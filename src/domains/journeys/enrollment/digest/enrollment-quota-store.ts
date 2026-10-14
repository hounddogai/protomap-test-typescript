import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentQuota } from "./enrollment-quota.js";

/** Keeps enrollment quotas by code. */
export interface EnrollmentQuotaStore {
  find(code: string): EnrollmentQuota | undefined;
  save(item: EnrollmentQuota): void;
  remove(code: string): boolean;
  list(): EnrollmentQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentQuotaStore implements EnrollmentQuotaStore {
  items: Map<string, EnrollmentQuota>;
  order: string[];

  constructor(items: Map<string, EnrollmentQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentQuota): void {
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

  list(): EnrollmentQuota[] {
    const out: EnrollmentQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentQuotaStore(): EnrollmentQuotaStore {
  return new MemoryEnrollmentQuotaStore(new Map<string, EnrollmentQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentQuotaStore implements EnrollmentQuotaStore {
  inner: EnrollmentQuotaStore;
  cache: cache.TtlCache<EnrollmentQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentQuotaStore,
    cacheValue: cache.TtlCache<EnrollmentQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentQuota | undefined {
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

  save(item: EnrollmentQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentQuota[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentQuotaStore(inner: EnrollmentQuotaStore, ttl: number, clockValue: clock.Clock): EnrollmentQuotaStore {
  return new CachedEnrollmentQuotaStore(inner, cache.newTtlCache<EnrollmentQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment quotas. Empty fields match all. */
export class EnrollmentQuotaQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentQuota[]): EnrollmentQuota[] {
    const matched = collections.filter(items, (candidate: EnrollmentQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentQuotas(store: EnrollmentQuotaStore, query: EnrollmentQuotaQuery): EnrollmentQuota[] {
  return query.apply(store.list());
}
