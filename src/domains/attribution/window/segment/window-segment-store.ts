import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowSegment } from "./window-segment.js";

/** Keeps window segments by code. */
export interface WindowSegmentStore {
  find(code: string): WindowSegment | undefined;
  save(item: WindowSegment): void;
  remove(code: string): boolean;
  list(): WindowSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowSegmentStore implements WindowSegmentStore {
  items: Map<string, WindowSegment>;
  order: string[];

  constructor(items: Map<string, WindowSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowSegment): void {
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

  list(): WindowSegment[] {
    const out: WindowSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowSegmentStore(): WindowSegmentStore {
  return new MemoryWindowSegmentStore(new Map<string, WindowSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowSegmentStore implements WindowSegmentStore {
  inner: WindowSegmentStore;
  cache: cache.TtlCache<WindowSegment>;
  hits: number;
  misses: number;

  constructor(inner: WindowSegmentStore, cacheValue: cache.TtlCache<WindowSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowSegment | undefined {
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

  save(item: WindowSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowSegment[] {
    return this.inner.list();
  }
}

export function newCachedWindowSegmentStore(inner: WindowSegmentStore, ttl: number, clockValue: clock.Clock): WindowSegmentStore {
  return new CachedWindowSegmentStore(inner, cache.newTtlCache<WindowSegment>(128, ttl, clockValue), 0, 0);
}

/** Selects window segments. Empty fields match all. */
export class WindowSegmentQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowSegment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowSegment[]): WindowSegment[] {
    const matched = collections.filter(items, (candidate: WindowSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowSegments(store: WindowSegmentStore, query: WindowSegmentQuery): WindowSegment[] {
  return query.apply(store.list());
}
