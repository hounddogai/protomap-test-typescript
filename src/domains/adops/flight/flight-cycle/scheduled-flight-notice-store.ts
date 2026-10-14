import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFlightNotice } from "./scheduled-flight-notice.js";

/** Keeps scheduled flight notices by code. */
export interface ScheduledFlightNoticeStore {
  find(code: string): ScheduledFlightNotice | undefined;
  save(item: ScheduledFlightNotice): void;
  remove(code: string): boolean;
  list(): ScheduledFlightNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFlightNoticeStore implements ScheduledFlightNoticeStore {
  items: Map<string, ScheduledFlightNotice>;
  order: string[];

  constructor(items: Map<string, ScheduledFlightNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFlightNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFlightNotice): void {
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

  list(): ScheduledFlightNotice[] {
    const out: ScheduledFlightNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFlightNoticeStore(): ScheduledFlightNoticeStore {
  return new MemoryScheduledFlightNoticeStore(new Map<string, ScheduledFlightNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFlightNoticeStore implements ScheduledFlightNoticeStore {
  inner: ScheduledFlightNoticeStore;
  cache: cache.TtlCache<ScheduledFlightNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFlightNoticeStore,
    cacheValue: cache.TtlCache<ScheduledFlightNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFlightNotice | undefined {
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

  save(item: ScheduledFlightNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFlightNotice[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFlightNoticeStore(inner: ScheduledFlightNoticeStore, ttl: number, clockValue: clock.Clock): ScheduledFlightNoticeStore {
  return new CachedScheduledFlightNoticeStore(
    inner,
    cache.newTtlCache<ScheduledFlightNotice>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled flight notices. Empty fields match all. */
export class ScheduledFlightNoticeQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFlightNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFlightNotice[]): ScheduledFlightNotice[] {
    const matched = collections.filter(items, (candidate: ScheduledFlightNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFlightNotices(store: ScheduledFlightNoticeStore, query: ScheduledFlightNoticeQuery): ScheduledFlightNotice[] {
  return query.apply(store.list());
}
