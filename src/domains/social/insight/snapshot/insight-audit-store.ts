import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightAudit } from "./insight-audit.js";

/** Keeps insight audits by code. */
export interface InsightAuditStore {
  find(code: string): InsightAudit | undefined;
  save(item: InsightAudit): void;
  remove(code: string): boolean;
  list(): InsightAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightAuditStore implements InsightAuditStore {
  items: Map<string, InsightAudit>;
  order: string[];

  constructor(items: Map<string, InsightAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightAudit): void {
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

  list(): InsightAudit[] {
    const out: InsightAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightAuditStore(): InsightAuditStore {
  return new MemoryInsightAuditStore(new Map<string, InsightAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightAuditStore implements InsightAuditStore {
  inner: InsightAuditStore;
  cache: cache.TtlCache<InsightAudit>;
  hits: number;
  misses: number;

  constructor(inner: InsightAuditStore, cacheValue: cache.TtlCache<InsightAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightAudit | undefined {
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

  save(item: InsightAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightAudit[] {
    return this.inner.list();
  }
}

export function newCachedInsightAuditStore(inner: InsightAuditStore, ttl: number, clockValue: clock.Clock): InsightAuditStore {
  return new CachedInsightAuditStore(inner, cache.newTtlCache<InsightAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects insight audits. Empty fields match all. */
export class InsightAuditQuery {
  country: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minAmount: number, statuses: string[], limit: number) {
    this.country = country;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightAudit[]): InsightAudit[] {
    const matched = collections.filter(items, (candidate: InsightAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightAudits(store: InsightAuditStore, query: InsightAuditQuery): InsightAudit[] {
  return query.apply(store.list());
}
