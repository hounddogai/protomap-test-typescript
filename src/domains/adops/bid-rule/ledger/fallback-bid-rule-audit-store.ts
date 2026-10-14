import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBidRuleAudit } from "./fallback-bid-rule-audit.js";

/** Keeps fallback bid rule audits by code. */
export interface FallbackBidRuleAuditStore {
  find(code: string): FallbackBidRuleAudit | undefined;
  save(item: FallbackBidRuleAudit): void;
  remove(code: string): boolean;
  list(): FallbackBidRuleAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBidRuleAuditStore implements FallbackBidRuleAuditStore {
  items: Map<string, FallbackBidRuleAudit>;
  order: string[];

  constructor(items: Map<string, FallbackBidRuleAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBidRuleAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBidRuleAudit): void {
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

  list(): FallbackBidRuleAudit[] {
    const out: FallbackBidRuleAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBidRuleAuditStore(): FallbackBidRuleAuditStore {
  return new MemoryFallbackBidRuleAuditStore(new Map<string, FallbackBidRuleAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBidRuleAuditStore implements FallbackBidRuleAuditStore {
  inner: FallbackBidRuleAuditStore;
  cache: cache.TtlCache<FallbackBidRuleAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBidRuleAuditStore,
    cacheValue: cache.TtlCache<FallbackBidRuleAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBidRuleAudit | undefined {
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

  save(item: FallbackBidRuleAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBidRuleAudit[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBidRuleAuditStore(inner: FallbackBidRuleAuditStore, ttl: number, clockValue: clock.Clock): FallbackBidRuleAuditStore {
  return new CachedFallbackBidRuleAuditStore(
    inner,
    cache.newTtlCache<FallbackBidRuleAudit>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bid rule audits. Empty fields match all. */
export class FallbackBidRuleAuditQuery {
  country: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMinimum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBidRuleAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBidRuleAudit[]): FallbackBidRuleAudit[] {
    const matched = collections.filter(items, (candidate: FallbackBidRuleAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBidRuleAudits(store: FallbackBidRuleAuditStore, query: FallbackBidRuleAuditQuery): FallbackBidRuleAudit[] {
  return query.apply(store.list());
}
