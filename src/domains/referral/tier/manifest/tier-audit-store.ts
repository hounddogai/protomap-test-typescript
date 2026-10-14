import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierAudit } from "./tier-audit.js";

/** Keeps tier audits by code. */
export interface TierAuditStore {
  find(code: string): TierAudit | undefined;
  save(item: TierAudit): void;
  remove(code: string): boolean;
  list(): TierAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierAuditStore implements TierAuditStore {
  items: Map<string, TierAudit>;
  order: string[];

  constructor(items: Map<string, TierAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierAudit): void {
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

  list(): TierAudit[] {
    const out: TierAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierAuditStore(): TierAuditStore {
  return new MemoryTierAuditStore(new Map<string, TierAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierAuditStore implements TierAuditStore {
  inner: TierAuditStore;
  cache: cache.TtlCache<TierAudit>;
  hits: number;
  misses: number;

  constructor(inner: TierAuditStore, cacheValue: cache.TtlCache<TierAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierAudit | undefined {
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

  save(item: TierAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierAudit[] {
    return this.inner.list();
  }
}

export function newCachedTierAuditStore(inner: TierAuditStore, ttl: number, clockValue: clock.Clock): TierAuditStore {
  return new CachedTierAuditStore(inner, cache.newTtlCache<TierAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects tier audits. Empty fields match all. */
export class TierAuditQuery {
  region: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minOpenRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierAudit): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierAudit[]): TierAudit[] {
    const matched = collections.filter(items, (candidate: TierAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierAudits(store: TierAuditStore, query: TierAuditQuery): TierAudit[] {
  return query.apply(store.list());
}
