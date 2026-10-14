import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingTicketViewAudit } from "./pending-ticket-view-audit.js";

/** Keeps pending ticket view audits by code. */
export interface PendingTicketViewAuditStore {
  find(code: string): PendingTicketViewAudit | undefined;
  save(item: PendingTicketViewAudit): void;
  remove(code: string): boolean;
  list(): PendingTicketViewAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingTicketViewAuditStore implements PendingTicketViewAuditStore {
  items: Map<string, PendingTicketViewAudit>;
  order: string[];

  constructor(items: Map<string, PendingTicketViewAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingTicketViewAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingTicketViewAudit): void {
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

  list(): PendingTicketViewAudit[] {
    const out: PendingTicketViewAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingTicketViewAuditStore(): PendingTicketViewAuditStore {
  return new MemoryPendingTicketViewAuditStore(new Map<string, PendingTicketViewAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingTicketViewAuditStore implements PendingTicketViewAuditStore {
  inner: PendingTicketViewAuditStore;
  cache: cache.TtlCache<PendingTicketViewAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingTicketViewAuditStore,
    cacheValue: cache.TtlCache<PendingTicketViewAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingTicketViewAudit | undefined {
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

  save(item: PendingTicketViewAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingTicketViewAudit[] {
    return this.inner.list();
  }
}

export function newCachedPendingTicketViewAuditStore(inner: PendingTicketViewAuditStore, ttl: number, clockValue: clock.Clock): PendingTicketViewAuditStore {
  return new CachedPendingTicketViewAuditStore(
    inner,
    cache.newTtlCache<PendingTicketViewAudit>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending ticket view audits. Empty fields match all. */
export class PendingTicketViewAuditQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingTicketViewAudit): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingTicketViewAudit[]): PendingTicketViewAudit[] {
    const matched = collections.filter(items, (candidate: PendingTicketViewAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingTicketViewAudits(store: PendingTicketViewAuditStore, query: PendingTicketViewAuditQuery): PendingTicketViewAudit[] {
  return query.apply(store.list());
}
