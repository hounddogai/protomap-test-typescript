import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelAudit } from "./funnel-audit.js";

/** Keeps funnel audits by code. */
export interface FunnelAuditStore {
  find(code: string): FunnelAudit | undefined;
  save(item: FunnelAudit): void;
  remove(code: string): boolean;
  list(): FunnelAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelAuditStore implements FunnelAuditStore {
  items: Map<string, FunnelAudit>;
  order: string[];

  constructor(items: Map<string, FunnelAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelAudit): void {
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

  list(): FunnelAudit[] {
    const out: FunnelAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelAuditStore(): FunnelAuditStore {
  return new MemoryFunnelAuditStore(new Map<string, FunnelAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelAuditStore implements FunnelAuditStore {
  inner: FunnelAuditStore;
  cache: cache.TtlCache<FunnelAudit>;
  hits: number;
  misses: number;

  constructor(inner: FunnelAuditStore, cacheValue: cache.TtlCache<FunnelAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelAudit | undefined {
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

  save(item: FunnelAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelAudit[] {
    return this.inner.list();
  }
}

export function newCachedFunnelAuditStore(inner: FunnelAuditStore, ttl: number, clockValue: clock.Clock): FunnelAuditStore {
  return new CachedFunnelAuditStore(inner, cache.newTtlCache<FunnelAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects funnel audits. Empty fields match all. */
export class FunnelAuditQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelAudit[]): FunnelAudit[] {
    const matched = collections.filter(items, (candidate: FunnelAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelAudits(store: FunnelAuditStore, query: FunnelAuditQuery): FunnelAudit[] {
  return query.apply(store.list());
}
