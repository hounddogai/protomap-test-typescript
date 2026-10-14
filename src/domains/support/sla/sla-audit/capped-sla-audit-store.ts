import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedSlaAudit } from "./capped-sla-audit.js";

/** Keeps capped sla audits by code. */
export interface CappedSlaAuditStore {
  find(code: string): CappedSlaAudit | undefined;
  save(item: CappedSlaAudit): void;
  remove(code: string): boolean;
  list(): CappedSlaAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedSlaAuditStore implements CappedSlaAuditStore {
  items: Map<string, CappedSlaAudit>;
  order: string[];

  constructor(items: Map<string, CappedSlaAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedSlaAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedSlaAudit): void {
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

  list(): CappedSlaAudit[] {
    const out: CappedSlaAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedSlaAuditStore(): CappedSlaAuditStore {
  return new MemoryCappedSlaAuditStore(new Map<string, CappedSlaAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedSlaAuditStore implements CappedSlaAuditStore {
  inner: CappedSlaAuditStore;
  cache: cache.TtlCache<CappedSlaAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedSlaAuditStore,
    cacheValue: cache.TtlCache<CappedSlaAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedSlaAudit | undefined {
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

  save(item: CappedSlaAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedSlaAudit[] {
    return this.inner.list();
  }
}

export function newCachedCappedSlaAuditStore(inner: CappedSlaAuditStore, ttl: number, clockValue: clock.Clock): CappedSlaAuditStore {
  return new CachedCappedSlaAuditStore(inner, cache.newTtlCache<CappedSlaAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects capped sla audits. Empty fields match all. */
export class CappedSlaAuditQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedSlaAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedSlaAudit[]): CappedSlaAudit[] {
    const matched = collections.filter(items, (candidate: CappedSlaAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedSlaAudits(store: CappedSlaAuditStore, query: CappedSlaAuditQuery): CappedSlaAudit[] {
  return query.apply(store.list());
}
