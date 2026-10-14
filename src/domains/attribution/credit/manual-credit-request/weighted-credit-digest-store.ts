import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCreditDigest } from "./weighted-credit-digest.js";

/** Keeps weighted credit digests by code. */
export interface WeightedCreditDigestStore {
  find(code: string): WeightedCreditDigest | undefined;
  save(item: WeightedCreditDigest): void;
  remove(code: string): boolean;
  list(): WeightedCreditDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCreditDigestStore implements WeightedCreditDigestStore {
  items: Map<string, WeightedCreditDigest>;
  order: string[];

  constructor(items: Map<string, WeightedCreditDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCreditDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCreditDigest): void {
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

  list(): WeightedCreditDigest[] {
    const out: WeightedCreditDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCreditDigestStore(): WeightedCreditDigestStore {
  return new MemoryWeightedCreditDigestStore(new Map<string, WeightedCreditDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCreditDigestStore implements WeightedCreditDigestStore {
  inner: WeightedCreditDigestStore;
  cache: cache.TtlCache<WeightedCreditDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCreditDigestStore,
    cacheValue: cache.TtlCache<WeightedCreditDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCreditDigest | undefined {
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

  save(item: WeightedCreditDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCreditDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCreditDigestStore(inner: WeightedCreditDigestStore, ttl: number, clockValue: clock.Clock): WeightedCreditDigestStore {
  return new CachedWeightedCreditDigestStore(inner, cache.newTtlCache<WeightedCreditDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted credit digests. Empty fields match all. */
export class WeightedCreditDigestQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCreditDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCreditDigest[]): WeightedCreditDigest[] {
    const matched = collections.filter(items, (candidate: WeightedCreditDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCreditDigests(store: WeightedCreditDigestStore, query: WeightedCreditDigestQuery): WeightedCreditDigest[] {
  return query.apply(store.list());
}
