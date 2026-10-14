import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewNotice } from "./ticket-view-notice.js";

/** Keeps ticket view notices by code. */
export interface TicketViewNoticeStore {
  find(code: string): TicketViewNotice | undefined;
  save(item: TicketViewNotice): void;
  remove(code: string): boolean;
  list(): TicketViewNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewNoticeStore implements TicketViewNoticeStore {
  items: Map<string, TicketViewNotice>;
  order: string[];

  constructor(items: Map<string, TicketViewNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewNotice): void {
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

  list(): TicketViewNotice[] {
    const out: TicketViewNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewNoticeStore(): TicketViewNoticeStore {
  return new MemoryTicketViewNoticeStore(new Map<string, TicketViewNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewNoticeStore implements TicketViewNoticeStore {
  inner: TicketViewNoticeStore;
  cache: cache.TtlCache<TicketViewNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewNoticeStore,
    cacheValue: cache.TtlCache<TicketViewNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewNotice | undefined {
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

  save(item: TicketViewNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewNotice[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewNoticeStore(inner: TicketViewNoticeStore, ttl: number, clockValue: clock.Clock): TicketViewNoticeStore {
  return new CachedTicketViewNoticeStore(inner, cache.newTtlCache<TicketViewNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects ticket view notices. Empty fields match all. */
export class TicketViewNoticeQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewNotice): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewNotice[]): TicketViewNotice[] {
    const matched = collections.filter(items, (candidate: TicketViewNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewNotices(store: TicketViewNoticeStore, query: TicketViewNoticeQuery): TicketViewNotice[] {
  return query.apply(store.list());
}
