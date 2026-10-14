import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewSummary } from "./ticket-view-summary.js";

/** Keeps ticket view summaries by code. */
export interface TicketViewSummaryStore {
  find(code: string): TicketViewSummary | undefined;
  save(item: TicketViewSummary): void;
  remove(code: string): boolean;
  list(): TicketViewSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewSummaryStore implements TicketViewSummaryStore {
  items: Map<string, TicketViewSummary>;
  order: string[];

  constructor(items: Map<string, TicketViewSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewSummary): void {
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

  list(): TicketViewSummary[] {
    const out: TicketViewSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewSummaryStore(): TicketViewSummaryStore {
  return new MemoryTicketViewSummaryStore(new Map<string, TicketViewSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewSummaryStore implements TicketViewSummaryStore {
  inner: TicketViewSummaryStore;
  cache: cache.TtlCache<TicketViewSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewSummaryStore,
    cacheValue: cache.TtlCache<TicketViewSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewSummary | undefined {
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

  save(item: TicketViewSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewSummary[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewSummaryStore(inner: TicketViewSummaryStore, ttl: number, clockValue: clock.Clock): TicketViewSummaryStore {
  return new CachedTicketViewSummaryStore(inner, cache.newTtlCache<TicketViewSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects ticket view summaries. Empty fields match all. */
export class TicketViewSummaryQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewSummary): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewSummary[]): TicketViewSummary[] {
    const matched = collections.filter(items, (candidate: TicketViewSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewSummaries(store: TicketViewSummaryStore, query: TicketViewSummaryQuery): TicketViewSummary[] {
  return query.apply(store.list());
}
