import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInAudit } from "./double-opt-in-audit.js";

/** Keeps double opt in audits by code. */
export interface DoubleOptInAuditStore {
  find(code: string): DoubleOptInAudit | undefined;
  save(item: DoubleOptInAudit): void;
  remove(code: string): boolean;
  list(): DoubleOptInAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInAuditStore implements DoubleOptInAuditStore {
  items: Map<string, DoubleOptInAudit>;
  order: string[];

  constructor(items: Map<string, DoubleOptInAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInAudit): void {
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

  list(): DoubleOptInAudit[] {
    const out: DoubleOptInAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInAuditStore(): DoubleOptInAuditStore {
  return new MemoryDoubleOptInAuditStore(new Map<string, DoubleOptInAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInAuditStore implements DoubleOptInAuditStore {
  inner: DoubleOptInAuditStore;
  cache: cache.TtlCache<DoubleOptInAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInAuditStore,
    cacheValue: cache.TtlCache<DoubleOptInAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInAudit | undefined {
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

  save(item: DoubleOptInAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInAudit[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInAuditStore(inner: DoubleOptInAuditStore, ttl: number, clockValue: clock.Clock): DoubleOptInAuditStore {
  return new CachedDoubleOptInAuditStore(inner, cache.newTtlCache<DoubleOptInAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects double opt in audits. Empty fields match all. */
export class DoubleOptInAuditQuery {
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

  matches(item: DoubleOptInAudit): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInAudit[]): DoubleOptInAudit[] {
    const matched = collections.filter(items, (candidate: DoubleOptInAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInAudits(store: DoubleOptInAuditStore, query: DoubleOptInAuditQuery): DoubleOptInAudit[] {
  return query.apply(store.list());
}
