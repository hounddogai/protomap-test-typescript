import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFlightException } from "./tiered-flight-exception.js";

/** Keeps tiered flight exceptions by code. */
export interface TieredFlightExceptionStore {
  find(code: string): TieredFlightException | undefined;
  save(item: TieredFlightException): void;
  remove(code: string): boolean;
  list(): TieredFlightException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFlightExceptionStore implements TieredFlightExceptionStore {
  items: Map<string, TieredFlightException>;
  order: string[];

  constructor(items: Map<string, TieredFlightException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFlightException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFlightException): void {
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

  list(): TieredFlightException[] {
    const out: TieredFlightException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFlightExceptionStore(): TieredFlightExceptionStore {
  return new MemoryTieredFlightExceptionStore(new Map<string, TieredFlightException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFlightExceptionStore implements TieredFlightExceptionStore {
  inner: TieredFlightExceptionStore;
  cache: cache.TtlCache<TieredFlightException>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFlightExceptionStore,
    cacheValue: cache.TtlCache<TieredFlightException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFlightException | undefined {
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

  save(item: TieredFlightException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFlightException[] {
    return this.inner.list();
  }
}

export function newCachedTieredFlightExceptionStore(inner: TieredFlightExceptionStore, ttl: number, clockValue: clock.Clock): TieredFlightExceptionStore {
  return new CachedTieredFlightExceptionStore(
    inner,
    cache.newTtlCache<TieredFlightException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered flight exceptions. Empty fields match all. */
export class TieredFlightExceptionQuery {
  category: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minScore: number, statuses: string[], limit: number) {
    this.category = category;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFlightException): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFlightException[]): TieredFlightException[] {
    const matched = collections.filter(items, (candidate: TieredFlightException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFlightExceptions(store: TieredFlightExceptionStore, query: TieredFlightExceptionQuery): TieredFlightException[] {
  return query.apply(store.list());
}
