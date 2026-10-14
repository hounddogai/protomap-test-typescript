import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredCohortAudit } from "./tiered-cohort-audit.js";

/** Keeps tiered cohort audits by code. */
export interface TieredCohortAuditStore {
  find(code: string): TieredCohortAudit | undefined;
  save(item: TieredCohortAudit): void;
  remove(code: string): boolean;
  list(): TieredCohortAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredCohortAuditStore implements TieredCohortAuditStore {
  items: Map<string, TieredCohortAudit>;
  order: string[];

  constructor(items: Map<string, TieredCohortAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredCohortAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredCohortAudit): void {
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

  list(): TieredCohortAudit[] {
    const out: TieredCohortAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredCohortAuditStore(): TieredCohortAuditStore {
  return new MemoryTieredCohortAuditStore(new Map<string, TieredCohortAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredCohortAuditStore implements TieredCohortAuditStore {
  inner: TieredCohortAuditStore;
  cache: cache.TtlCache<TieredCohortAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredCohortAuditStore,
    cacheValue: cache.TtlCache<TieredCohortAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredCohortAudit | undefined {
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

  save(item: TieredCohortAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredCohortAudit[] {
    return this.inner.list();
  }
}

export function newCachedTieredCohortAuditStore(inner: TieredCohortAuditStore, ttl: number, clockValue: clock.Clock): TieredCohortAuditStore {
  return new CachedTieredCohortAuditStore(inner, cache.newTtlCache<TieredCohortAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered cohort audits. Empty fields match all. */
export class TieredCohortAuditQuery {
  country: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredCohortAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredCohortAudit[]): TieredCohortAudit[] {
    const matched = collections.filter(items, (candidate: TieredCohortAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredCohortAudits(store: TieredCohortAuditStore, query: TieredCohortAuditQuery): TieredCohortAudit[] {
  return query.apply(store.list());
}
