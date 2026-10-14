import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewAudit } from "./ticket-view-audit.js";

/** Keeps ticket view audits by code. */
export interface TicketViewAuditStore {
  find(code: string): TicketViewAudit | undefined;
  save(item: TicketViewAudit): void;
  remove(code: string): boolean;
  list(): TicketViewAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewAuditStore implements TicketViewAuditStore {
  items: Map<string, TicketViewAudit>;
  order: string[];

  constructor(items: Map<string, TicketViewAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewAudit): void {
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

  list(): TicketViewAudit[] {
    const out: TicketViewAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewAuditStore(): TicketViewAuditStore {
  return new MemoryTicketViewAuditStore(new Map<string, TicketViewAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewAuditStore implements TicketViewAuditStore {
  inner: TicketViewAuditStore;
  cache: cache.TtlCache<TicketViewAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewAuditStore,
    cacheValue: cache.TtlCache<TicketViewAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewAudit | undefined {
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

  save(item: TicketViewAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewAudit[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewAuditStore(inner: TicketViewAuditStore, ttl: number, clockValue: clock.Clock): TicketViewAuditStore {
  return new CachedTicketViewAuditStore(inner, cache.newTtlCache<TicketViewAudit>(128, ttl, clockValue), 0, 0);
}

/** Selects ticket view audits. Empty fields match all. */
export class TicketViewAuditQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewAudit[]): TicketViewAudit[] {
    const matched = collections.filter(items, (candidate: TicketViewAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewAudits(store: TicketViewAuditStore, query: TicketViewAuditQuery): TicketViewAudit[] {
  return query.apply(store.list());
}
