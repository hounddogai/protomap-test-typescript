import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPaywallAudit } from "./pending-paywall-audit.js";

/** Keeps pending paywall audits by code. */
export interface PendingPaywallAuditStore {
  find(code: string): PendingPaywallAudit | undefined;
  save(item: PendingPaywallAudit): void;
  remove(code: string): boolean;
  list(): PendingPaywallAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPaywallAuditStore implements PendingPaywallAuditStore {
  items: Map<string, PendingPaywallAudit>;
  order: string[];

  constructor(items: Map<string, PendingPaywallAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPaywallAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPaywallAudit): void {
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

  list(): PendingPaywallAudit[] {
    const out: PendingPaywallAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPaywallAuditStore(): PendingPaywallAuditStore {
  return new MemoryPendingPaywallAuditStore(new Map<string, PendingPaywallAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPaywallAuditStore implements PendingPaywallAuditStore {
  inner: PendingPaywallAuditStore;
  cache: cache.TtlCache<PendingPaywallAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPaywallAuditStore,
    cacheValue: cache.TtlCache<PendingPaywallAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPaywallAudit | undefined {
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

  save(item: PendingPaywallAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPaywallAudit[] {
    return this.inner.list();
  }
}

export function newCachedPendingPaywallAuditStore(inner: PendingPaywallAuditStore, ttl: number, clockValue: clock.Clock): PendingPaywallAuditStore {
  return new CachedPendingPaywallAuditStore(inner, cache.newTtlCache<PendingPaywallAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects pending paywall audits. Empty fields match all. */
export class PendingPaywallAuditQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPaywallAudit): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPaywallAudit[]): PendingPaywallAudit[] {
    const matched = collections.filter(items, (candidate: PendingPaywallAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPaywallAudits(store: PendingPaywallAuditStore, query: PendingPaywallAuditQuery): PendingPaywallAudit[] {
  return query.apply(store.list());
}
