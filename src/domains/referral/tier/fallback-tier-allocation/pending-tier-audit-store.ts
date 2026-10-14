import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingTierAudit } from "./pending-tier-audit.js";

/** Keeps pending tier audits by code. */
export interface PendingTierAuditStore {
  find(code: string): PendingTierAudit | undefined;
  save(item: PendingTierAudit): void;
  remove(code: string): boolean;
  list(): PendingTierAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingTierAuditStore implements PendingTierAuditStore {
  items: Map<string, PendingTierAudit>;
  order: string[];

  constructor(items: Map<string, PendingTierAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingTierAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingTierAudit): void {
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

  list(): PendingTierAudit[] {
    const out: PendingTierAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingTierAuditStore(): PendingTierAuditStore {
  return new MemoryPendingTierAuditStore(new Map<string, PendingTierAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingTierAuditStore implements PendingTierAuditStore {
  inner: PendingTierAuditStore;
  cache: cache.TtlCache<PendingTierAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingTierAuditStore,
    cacheValue: cache.TtlCache<PendingTierAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingTierAudit | undefined {
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

  save(item: PendingTierAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingTierAudit[] {
    return this.inner.list();
  }
}

export function newCachedPendingTierAuditStore(inner: PendingTierAuditStore, ttl: number, clockValue: clock.Clock): PendingTierAuditStore {
  return new CachedPendingTierAuditStore(inner, cache.newTtlCache<PendingTierAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects pending tier audits. Empty fields match all. */
export class PendingTierAuditQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingTierAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingTierAudit[]): PendingTierAudit[] {
    const matched = collections.filter(items, (candidate: PendingTierAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingTierAudits(store: PendingTierAuditStore, query: PendingTierAuditQuery): PendingTierAudit[] {
  return query.apply(store.list());
}
