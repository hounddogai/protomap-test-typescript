import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedDoubleOptInDigest } from "./weighted-double-opt-in-digest.js";

/** Keeps weighted double opt in digests by code. */
export interface WeightedDoubleOptInDigestStore {
  find(code: string): WeightedDoubleOptInDigest | undefined;
  save(item: WeightedDoubleOptInDigest): void;
  remove(code: string): boolean;
  list(): WeightedDoubleOptInDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedDoubleOptInDigestStore implements WeightedDoubleOptInDigestStore {
  items: Map<string, WeightedDoubleOptInDigest>;
  order: string[];

  constructor(items: Map<string, WeightedDoubleOptInDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedDoubleOptInDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedDoubleOptInDigest): void {
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

  list(): WeightedDoubleOptInDigest[] {
    const out: WeightedDoubleOptInDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedDoubleOptInDigestStore(): WeightedDoubleOptInDigestStore {
  return new MemoryWeightedDoubleOptInDigestStore(new Map<string, WeightedDoubleOptInDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedDoubleOptInDigestStore implements WeightedDoubleOptInDigestStore {
  inner: WeightedDoubleOptInDigestStore;
  cache: cache.TtlCache<WeightedDoubleOptInDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedDoubleOptInDigestStore,
    cacheValue: cache.TtlCache<WeightedDoubleOptInDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedDoubleOptInDigest | undefined {
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

  save(item: WeightedDoubleOptInDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedDoubleOptInDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedDoubleOptInDigestStore(inner: WeightedDoubleOptInDigestStore, ttl: number, clockValue: clock.Clock): WeightedDoubleOptInDigestStore {
  return new CachedWeightedDoubleOptInDigestStore(
    inner,
    cache.newTtlCache<WeightedDoubleOptInDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted double opt in digests. Empty fields match all. */
export class WeightedDoubleOptInDigestQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedDoubleOptInDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedDoubleOptInDigest[]): WeightedDoubleOptInDigest[] {
    const matched = collections.filter(items, (candidate: WeightedDoubleOptInDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedDoubleOptInDigests(store: WeightedDoubleOptInDigestStore, query: WeightedDoubleOptInDigestQuery): WeightedDoubleOptInDigest[] {
  return query.apply(store.list());
}
