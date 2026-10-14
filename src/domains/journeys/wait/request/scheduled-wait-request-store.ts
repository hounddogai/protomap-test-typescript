import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWaitRequest } from "./scheduled-wait-request.js";

/** Keeps scheduled wait requests by code. */
export interface ScheduledWaitRequestStore {
  find(code: string): ScheduledWaitRequest | undefined;
  save(item: ScheduledWaitRequest): void;
  remove(code: string): boolean;
  list(): ScheduledWaitRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWaitRequestStore implements ScheduledWaitRequestStore {
  items: Map<string, ScheduledWaitRequest>;
  order: string[];

  constructor(items: Map<string, ScheduledWaitRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWaitRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWaitRequest): void {
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

  list(): ScheduledWaitRequest[] {
    const out: ScheduledWaitRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWaitRequestStore(): ScheduledWaitRequestStore {
  return new MemoryScheduledWaitRequestStore(new Map<string, ScheduledWaitRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWaitRequestStore implements ScheduledWaitRequestStore {
  inner: ScheduledWaitRequestStore;
  cache: cache.TtlCache<ScheduledWaitRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWaitRequestStore,
    cacheValue: cache.TtlCache<ScheduledWaitRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWaitRequest | undefined {
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

  save(item: ScheduledWaitRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWaitRequest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWaitRequestStore(inner: ScheduledWaitRequestStore, ttl: number, clockValue: clock.Clock): ScheduledWaitRequestStore {
  return new CachedScheduledWaitRequestStore(
    inner,
    cache.newTtlCache<ScheduledWaitRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled wait requests. Empty fields match all. */
export class ScheduledWaitRequestQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWaitRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWaitRequest[]): ScheduledWaitRequest[] {
    const matched = collections.filter(items, (candidate: ScheduledWaitRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWaitRequests(store: ScheduledWaitRequestStore, query: ScheduledWaitRequestQuery): ScheduledWaitRequest[] {
  return query.apply(store.list());
}
