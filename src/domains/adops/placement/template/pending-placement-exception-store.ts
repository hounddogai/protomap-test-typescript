import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPlacementException } from "./pending-placement-exception.js";

/** Keeps pending placement exceptions by code. */
export interface PendingPlacementExceptionStore {
  find(code: string): PendingPlacementException | undefined;
  save(item: PendingPlacementException): void;
  remove(code: string): boolean;
  list(): PendingPlacementException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPlacementExceptionStore implements PendingPlacementExceptionStore {
  items: Map<string, PendingPlacementException>;
  order: string[];

  constructor(items: Map<string, PendingPlacementException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPlacementException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPlacementException): void {
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

  list(): PendingPlacementException[] {
    const out: PendingPlacementException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPlacementExceptionStore(): PendingPlacementExceptionStore {
  return new MemoryPendingPlacementExceptionStore(new Map<string, PendingPlacementException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPlacementExceptionStore implements PendingPlacementExceptionStore {
  inner: PendingPlacementExceptionStore;
  cache: cache.TtlCache<PendingPlacementException>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPlacementExceptionStore,
    cacheValue: cache.TtlCache<PendingPlacementException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPlacementException | undefined {
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

  save(item: PendingPlacementException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPlacementException[] {
    return this.inner.list();
  }
}

export function newCachedPendingPlacementExceptionStore(inner: PendingPlacementExceptionStore, ttl: number, clockValue: clock.Clock): PendingPlacementExceptionStore {
  return new CachedPendingPlacementExceptionStore(
    inner,
    cache.newTtlCache<PendingPlacementException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending placement exceptions. Empty fields match all. */
export class PendingPlacementExceptionQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPlacementException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPlacementException[]): PendingPlacementException[] {
    const matched = collections.filter(items, (candidate: PendingPlacementException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPlacementExceptions(store: PendingPlacementExceptionStore, query: PendingPlacementExceptionQuery): PendingPlacementException[] {
  return query.apply(store.list());
}
