import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupAudit } from "./warmup-audit.js";

/** Keeps warmup audits by code. */
export interface WarmupAuditStore {
  find(code: string): WarmupAudit | undefined;
  save(item: WarmupAudit): void;
  remove(code: string): boolean;
  list(): WarmupAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupAuditStore implements WarmupAuditStore {
  items: Map<string, WarmupAudit>;
  order: string[];

  constructor(items: Map<string, WarmupAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupAudit): void {
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

  list(): WarmupAudit[] {
    const out: WarmupAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupAuditStore(): WarmupAuditStore {
  return new MemoryWarmupAuditStore(new Map<string, WarmupAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupAuditStore implements WarmupAuditStore {
  inner: WarmupAuditStore;
  cache: cache.TtlCache<WarmupAudit>;
  hits: number;
  misses: number;

  constructor(inner: WarmupAuditStore, cacheValue: cache.TtlCache<WarmupAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupAudit | undefined {
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

  save(item: WarmupAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupAudit[] {
    return this.inner.list();
  }
}

export function newCachedWarmupAuditStore(inner: WarmupAuditStore, ttl: number, clockValue: clock.Clock): WarmupAuditStore {
  return new CachedWarmupAuditStore(inner, cache.newTtlCache<WarmupAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup audits. Empty fields match all. */
export class WarmupAuditQuery {
  country: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCapacity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupAudit[]): WarmupAudit[] {
    const matched = collections.filter(items, (candidate: WarmupAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupAudits(store: WarmupAuditStore, query: WarmupAuditQuery): WarmupAudit[] {
  return query.apply(store.list());
}
