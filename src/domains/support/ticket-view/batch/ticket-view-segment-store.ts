import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewSegment } from "./ticket-view-segment.js";

/** Keeps ticket view segments by code. */
export interface TicketViewSegmentStore {
  find(code: string): TicketViewSegment | undefined;
  save(item: TicketViewSegment): void;
  remove(code: string): boolean;
  list(): TicketViewSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewSegmentStore implements TicketViewSegmentStore {
  items: Map<string, TicketViewSegment>;
  order: string[];

  constructor(items: Map<string, TicketViewSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewSegment): void {
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

  list(): TicketViewSegment[] {
    const out: TicketViewSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewSegmentStore(): TicketViewSegmentStore {
  return new MemoryTicketViewSegmentStore(new Map<string, TicketViewSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewSegmentStore implements TicketViewSegmentStore {
  inner: TicketViewSegmentStore;
  cache: cache.TtlCache<TicketViewSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewSegmentStore,
    cacheValue: cache.TtlCache<TicketViewSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewSegment | undefined {
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

  save(item: TicketViewSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewSegment[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewSegmentStore(inner: TicketViewSegmentStore, ttl: number, clockValue: clock.Clock): TicketViewSegmentStore {
  return new CachedTicketViewSegmentStore(inner, cache.newTtlCache<TicketViewSegment>(1024, ttl, clockValue), 0, 0);
}

/** Selects ticket view segments. Empty fields match all. */
export class TicketViewSegmentQuery {
  category: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSequence: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewSegment[]): TicketViewSegment[] {
    const matched = collections.filter(items, (candidate: TicketViewSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewSegments(store: TicketViewSegmentStore, query: TicketViewSegmentQuery): TicketViewSegment[] {
  return query.apply(store.list());
}
