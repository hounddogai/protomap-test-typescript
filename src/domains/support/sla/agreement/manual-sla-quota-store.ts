import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSlaQuota } from "./manual-sla-quota.js";

/** Keeps manual sla quotas by code. */
export interface ManualSlaQuotaStore {
  find(code: string): ManualSlaQuota | undefined;
  save(item: ManualSlaQuota): void;
  remove(code: string): boolean;
  list(): ManualSlaQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSlaQuotaStore implements ManualSlaQuotaStore {
  items: Map<string, ManualSlaQuota>;
  order: string[];

  constructor(items: Map<string, ManualSlaQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSlaQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSlaQuota): void {
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

  list(): ManualSlaQuota[] {
    const out: ManualSlaQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSlaQuotaStore(): ManualSlaQuotaStore {
  return new MemoryManualSlaQuotaStore(new Map<string, ManualSlaQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSlaQuotaStore implements ManualSlaQuotaStore {
  inner: ManualSlaQuotaStore;
  cache: cache.TtlCache<ManualSlaQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSlaQuotaStore,
    cacheValue: cache.TtlCache<ManualSlaQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSlaQuota | undefined {
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

  save(item: ManualSlaQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSlaQuota[] {
    return this.inner.list();
  }
}

export function newCachedManualSlaQuotaStore(inner: ManualSlaQuotaStore, ttl: number, clockValue: clock.Clock): ManualSlaQuotaStore {
  return new CachedManualSlaQuotaStore(inner, cache.newTtlCache<ManualSlaQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects manual sla quotas. Empty fields match all. */
export class ManualSlaQuotaQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSlaQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSlaQuota[]): ManualSlaQuota[] {
    const matched = collections.filter(items, (candidate: ManualSlaQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSlaQuotas(store: ManualSlaQuotaStore, query: ManualSlaQuotaQuery): ManualSlaQuota[] {
  return query.apply(store.list());
}
