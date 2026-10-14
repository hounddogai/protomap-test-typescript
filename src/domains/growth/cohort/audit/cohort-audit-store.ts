import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortAudit } from "./cohort-audit.js";

/** Keeps cohort audits by code. */
export interface CohortAuditStore {
  find(code: string): CohortAudit | undefined;
  save(item: CohortAudit): void;
  remove(code: string): boolean;
  list(): CohortAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortAuditStore implements CohortAuditStore {
  items: Map<string, CohortAudit>;
  order: string[];

  constructor(items: Map<string, CohortAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortAudit): void {
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

  list(): CohortAudit[] {
    const out: CohortAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortAuditStore(): CohortAuditStore {
  return new MemoryCohortAuditStore(new Map<string, CohortAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortAuditStore implements CohortAuditStore {
  inner: CohortAuditStore;
  cache: cache.TtlCache<CohortAudit>;
  hits: number;
  misses: number;

  constructor(inner: CohortAuditStore, cacheValue: cache.TtlCache<CohortAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortAudit | undefined {
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

  save(item: CohortAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortAudit[] {
    return this.inner.list();
  }
}

export function newCachedCohortAuditStore(inner: CohortAuditStore, ttl: number, clockValue: clock.Clock): CohortAuditStore {
  return new CachedCohortAuditStore(inner, cache.newTtlCache<CohortAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort audits. Empty fields match all. */
export class CohortAuditQuery {
  category: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDiscount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortAudit): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortAudit[]): CohortAudit[] {
    const matched = collections.filter(items, (candidate: CohortAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortAudits(store: CohortAuditStore, query: CohortAuditQuery): CohortAudit[] {
  return query.apply(store.list());
}
