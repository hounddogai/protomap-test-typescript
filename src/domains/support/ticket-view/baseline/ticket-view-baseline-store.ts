import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewBaseline } from "./ticket-view-baseline.js";

/** Keeps ticket view baselines by code. */
export interface TicketViewBaselineStore {
  find(code: string): TicketViewBaseline | undefined;
  save(item: TicketViewBaseline): void;
  remove(code: string): boolean;
  list(): TicketViewBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewBaselineStore implements TicketViewBaselineStore {
  items: Map<string, TicketViewBaseline>;
  order: string[];

  constructor(items: Map<string, TicketViewBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewBaseline): void {
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

  list(): TicketViewBaseline[] {
    const out: TicketViewBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewBaselineStore(): TicketViewBaselineStore {
  return new MemoryTicketViewBaselineStore(new Map<string, TicketViewBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewBaselineStore implements TicketViewBaselineStore {
  inner: TicketViewBaselineStore;
  cache: cache.TtlCache<TicketViewBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewBaselineStore,
    cacheValue: cache.TtlCache<TicketViewBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewBaseline | undefined {
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

  save(item: TicketViewBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewBaseline[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewBaselineStore(inner: TicketViewBaselineStore, ttl: number, clockValue: clock.Clock): TicketViewBaselineStore {
  return new CachedTicketViewBaselineStore(inner, cache.newTtlCache<TicketViewBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view baselines. Empty fields match all. */
export class TicketViewBaselineQuery {
  utmSource: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSendAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewBaseline): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewBaseline[]): TicketViewBaseline[] {
    const matched = collections.filter(items, (candidate: TicketViewBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewBaselines(store: TicketViewBaselineStore, query: TicketViewBaselineQuery): TicketViewBaseline[] {
  return query.apply(store.list());
}
