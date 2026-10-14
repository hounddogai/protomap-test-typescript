import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingTouchpointWindow } from "./pending-touchpoint-window.js";

/** Keeps pending touchpoint windows by code. */
export interface PendingTouchpointWindowStore {
  find(code: string): PendingTouchpointWindow | undefined;
  save(item: PendingTouchpointWindow): void;
  remove(code: string): boolean;
  list(): PendingTouchpointWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingTouchpointWindowStore implements PendingTouchpointWindowStore {
  items: Map<string, PendingTouchpointWindow>;
  order: string[];

  constructor(items: Map<string, PendingTouchpointWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingTouchpointWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingTouchpointWindow): void {
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

  list(): PendingTouchpointWindow[] {
    const out: PendingTouchpointWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingTouchpointWindowStore(): PendingTouchpointWindowStore {
  return new MemoryPendingTouchpointWindowStore(new Map<string, PendingTouchpointWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingTouchpointWindowStore implements PendingTouchpointWindowStore {
  inner: PendingTouchpointWindowStore;
  cache: cache.TtlCache<PendingTouchpointWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingTouchpointWindowStore,
    cacheValue: cache.TtlCache<PendingTouchpointWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingTouchpointWindow | undefined {
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

  save(item: PendingTouchpointWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingTouchpointWindow[] {
    return this.inner.list();
  }
}

export function newCachedPendingTouchpointWindowStore(inner: PendingTouchpointWindowStore, ttl: number, clockValue: clock.Clock): PendingTouchpointWindowStore {
  return new CachedPendingTouchpointWindowStore(
    inner,
    cache.newTtlCache<PendingTouchpointWindow>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending touchpoint windows. Empty fields match all. */
export class PendingTouchpointWindowQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingTouchpointWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingTouchpointWindow[]): PendingTouchpointWindow[] {
    const matched = collections.filter(items, (candidate: PendingTouchpointWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingTouchpointWindows(store: PendingTouchpointWindowStore, query: PendingTouchpointWindowQuery): PendingTouchpointWindow[] {
  return query.apply(store.list());
}
