import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewAdjustment } from "./ticket-view-adjustment.js";

/** Keeps ticket view adjustments by code. */
export interface TicketViewAdjustmentStore {
  find(code: string): TicketViewAdjustment | undefined;
  save(item: TicketViewAdjustment): void;
  remove(code: string): boolean;
  list(): TicketViewAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewAdjustmentStore implements TicketViewAdjustmentStore {
  items: Map<string, TicketViewAdjustment>;
  order: string[];

  constructor(items: Map<string, TicketViewAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewAdjustment): void {
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

  list(): TicketViewAdjustment[] {
    const out: TicketViewAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewAdjustmentStore(): TicketViewAdjustmentStore {
  return new MemoryTicketViewAdjustmentStore(new Map<string, TicketViewAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewAdjustmentStore implements TicketViewAdjustmentStore {
  inner: TicketViewAdjustmentStore;
  cache: cache.TtlCache<TicketViewAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewAdjustmentStore,
    cacheValue: cache.TtlCache<TicketViewAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewAdjustment | undefined {
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

  save(item: TicketViewAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewAdjustmentStore(inner: TicketViewAdjustmentStore, ttl: number, clockValue: clock.Clock): TicketViewAdjustmentStore {
  return new CachedTicketViewAdjustmentStore(
    inner,
    cache.newTtlCache<TicketViewAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects ticket view adjustments. Empty fields match all. */
export class TicketViewAdjustmentQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewAdjustment[]): TicketViewAdjustment[] {
    const matched = collections.filter(items, (candidate: TicketViewAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewAdjustments(store: TicketViewAdjustmentStore, query: TicketViewAdjustmentQuery): TicketViewAdjustment[] {
  return query.apply(store.list());
}
