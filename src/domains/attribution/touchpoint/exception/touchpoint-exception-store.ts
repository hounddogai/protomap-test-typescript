import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointException } from "./touchpoint-exception.js";

/** Keeps touchpoint exceptions by code. */
export interface TouchpointExceptionStore {
  find(code: string): TouchpointException | undefined;
  save(item: TouchpointException): void;
  remove(code: string): boolean;
  list(): TouchpointException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointExceptionStore implements TouchpointExceptionStore {
  items: Map<string, TouchpointException>;
  order: string[];

  constructor(items: Map<string, TouchpointException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointException): void {
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

  list(): TouchpointException[] {
    const out: TouchpointException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointExceptionStore(): TouchpointExceptionStore {
  return new MemoryTouchpointExceptionStore(new Map<string, TouchpointException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointExceptionStore implements TouchpointExceptionStore {
  inner: TouchpointExceptionStore;
  cache: cache.TtlCache<TouchpointException>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointExceptionStore,
    cacheValue: cache.TtlCache<TouchpointException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointException | undefined {
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

  save(item: TouchpointException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointException[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointExceptionStore(inner: TouchpointExceptionStore, ttl: number, clockValue: clock.Clock): TouchpointExceptionStore {
  return new CachedTouchpointExceptionStore(inner, cache.newTtlCache<TouchpointException>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint exceptions. Empty fields match all. */
export class TouchpointExceptionQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointException): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointException[]): TouchpointException[] {
    const matched = collections.filter(items, (candidate: TouchpointException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointExceptions(store: TouchpointExceptionStore, query: TouchpointExceptionQuery): TouchpointException[] {
  return query.apply(store.list());
}
