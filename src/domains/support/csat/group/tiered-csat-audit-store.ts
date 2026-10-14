import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredCsatAudit } from "./tiered-csat-audit.js";

/** Keeps tiered csat audits by code. */
export interface TieredCsatAuditStore {
  find(code: string): TieredCsatAudit | undefined;
  save(item: TieredCsatAudit): void;
  remove(code: string): boolean;
  list(): TieredCsatAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredCsatAuditStore implements TieredCsatAuditStore {
  items: Map<string, TieredCsatAudit>;
  order: string[];

  constructor(items: Map<string, TieredCsatAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredCsatAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredCsatAudit): void {
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

  list(): TieredCsatAudit[] {
    const out: TieredCsatAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredCsatAuditStore(): TieredCsatAuditStore {
  return new MemoryTieredCsatAuditStore(new Map<string, TieredCsatAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredCsatAuditStore implements TieredCsatAuditStore {
  inner: TieredCsatAuditStore;
  cache: cache.TtlCache<TieredCsatAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredCsatAuditStore,
    cacheValue: cache.TtlCache<TieredCsatAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredCsatAudit | undefined {
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

  save(item: TieredCsatAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredCsatAudit[] {
    return this.inner.list();
  }
}

export function newCachedTieredCsatAuditStore(inner: TieredCsatAuditStore, ttl: number, clockValue: clock.Clock): TieredCsatAuditStore {
  return new CachedTieredCsatAuditStore(inner, cache.newTtlCache<TieredCsatAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered csat audits. Empty fields match all. */
export class TieredCsatAuditQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredCsatAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredCsatAudit[]): TieredCsatAudit[] {
    const matched = collections.filter(items, (candidate: TieredCsatAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredCsatAudits(store: TieredCsatAuditStore, query: TieredCsatAuditQuery): TieredCsatAudit[] {
  return query.apply(store.list());
}
