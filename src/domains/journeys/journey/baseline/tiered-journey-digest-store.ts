import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredJourneyDigest } from "./tiered-journey-digest.js";

/** Keeps tiered journey digests by code. */
export interface TieredJourneyDigestStore {
  find(code: string): TieredJourneyDigest | undefined;
  save(item: TieredJourneyDigest): void;
  remove(code: string): boolean;
  list(): TieredJourneyDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredJourneyDigestStore implements TieredJourneyDigestStore {
  items: Map<string, TieredJourneyDigest>;
  order: string[];

  constructor(items: Map<string, TieredJourneyDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredJourneyDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredJourneyDigest): void {
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

  list(): TieredJourneyDigest[] {
    const out: TieredJourneyDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredJourneyDigestStore(): TieredJourneyDigestStore {
  return new MemoryTieredJourneyDigestStore(new Map<string, TieredJourneyDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredJourneyDigestStore implements TieredJourneyDigestStore {
  inner: TieredJourneyDigestStore;
  cache: cache.TtlCache<TieredJourneyDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredJourneyDigestStore,
    cacheValue: cache.TtlCache<TieredJourneyDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredJourneyDigest | undefined {
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

  save(item: TieredJourneyDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredJourneyDigest[] {
    return this.inner.list();
  }
}

export function newCachedTieredJourneyDigestStore(inner: TieredJourneyDigestStore, ttl: number, clockValue: clock.Clock): TieredJourneyDigestStore {
  return new CachedTieredJourneyDigestStore(inner, cache.newTtlCache<TieredJourneyDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered journey digests. Empty fields match all. */
export class TieredJourneyDigestQuery {
  source: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCapacity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredJourneyDigest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredJourneyDigest[]): TieredJourneyDigest[] {
    const matched = collections.filter(items, (candidate: TieredJourneyDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredJourneyDigests(store: TieredJourneyDigestStore, query: TieredJourneyDigestQuery): TieredJourneyDigest[] {
  return query.apply(store.list());
}
