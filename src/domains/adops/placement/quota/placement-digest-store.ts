import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementDigest } from "./placement-digest.js";

/** Keeps placement digests by code. */
export interface PlacementDigestStore {
  find(code: string): PlacementDigest | undefined;
  save(item: PlacementDigest): void;
  remove(code: string): boolean;
  list(): PlacementDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementDigestStore implements PlacementDigestStore {
  items: Map<string, PlacementDigest>;
  order: string[];

  constructor(items: Map<string, PlacementDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementDigest): void {
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

  list(): PlacementDigest[] {
    const out: PlacementDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementDigestStore(): PlacementDigestStore {
  return new MemoryPlacementDigestStore(new Map<string, PlacementDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementDigestStore implements PlacementDigestStore {
  inner: PlacementDigestStore;
  cache: cache.TtlCache<PlacementDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementDigestStore,
    cacheValue: cache.TtlCache<PlacementDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementDigest | undefined {
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

  save(item: PlacementDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementDigest[] {
    return this.inner.list();
  }
}

export function newCachedPlacementDigestStore(inner: PlacementDigestStore, ttl: number, clockValue: clock.Clock): PlacementDigestStore {
  return new CachedPlacementDigestStore(inner, cache.newTtlCache<PlacementDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects placement digests. Empty fields match all. */
export class PlacementDigestQuery {
  unit: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minConversionRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementDigest[]): PlacementDigest[] {
    const matched = collections.filter(items, (candidate: PlacementDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementDigests(store: PlacementDigestStore, query: PlacementDigestQuery): PlacementDigest[] {
  return query.apply(store.list());
}
