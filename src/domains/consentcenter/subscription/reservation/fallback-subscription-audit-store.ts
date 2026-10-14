import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionAudit } from "./fallback-subscription-audit.js";

/** Keeps fallback subscription audits by code. */
export interface FallbackSubscriptionAuditStore {
  find(code: string): FallbackSubscriptionAudit | undefined;
  save(item: FallbackSubscriptionAudit): void;
  remove(code: string): boolean;
  list(): FallbackSubscriptionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSubscriptionAuditStore implements FallbackSubscriptionAuditStore {
  items: Map<string, FallbackSubscriptionAudit>;
  order: string[];

  constructor(items: Map<string, FallbackSubscriptionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSubscriptionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSubscriptionAudit): void {
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

  list(): FallbackSubscriptionAudit[] {
    const out: FallbackSubscriptionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSubscriptionAuditStore(): FallbackSubscriptionAuditStore {
  return new MemoryFallbackSubscriptionAuditStore(new Map<string, FallbackSubscriptionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSubscriptionAuditStore implements FallbackSubscriptionAuditStore {
  inner: FallbackSubscriptionAuditStore;
  cache: cache.TtlCache<FallbackSubscriptionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSubscriptionAuditStore,
    cacheValue: cache.TtlCache<FallbackSubscriptionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSubscriptionAudit | undefined {
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

  save(item: FallbackSubscriptionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSubscriptionAudit[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSubscriptionAuditStore(inner: FallbackSubscriptionAuditStore, ttl: number, clockValue: clock.Clock): FallbackSubscriptionAuditStore {
  return new CachedFallbackSubscriptionAuditStore(
    inner,
    cache.newTtlCache<FallbackSubscriptionAudit>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback subscription audits. Empty fields match all. */
export class FallbackSubscriptionAuditQuery {
  region: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCeiling: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSubscriptionAudit): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSubscriptionAudit[]): FallbackSubscriptionAudit[] {
    const matched = collections.filter(items, (candidate: FallbackSubscriptionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSubscriptionAudits(store: FallbackSubscriptionAuditStore, query: FallbackSubscriptionAuditQuery): FallbackSubscriptionAudit[] {
  return query.apply(store.list());
}
