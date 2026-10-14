import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedOptOutProfile } from "./weighted-opt-out-profile.js";

/** Keeps weighted opt out profiles by code. */
export interface WeightedOptOutProfileStore {
  find(code: string): WeightedOptOutProfile | undefined;
  save(item: WeightedOptOutProfile): void;
  remove(code: string): boolean;
  list(): WeightedOptOutProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedOptOutProfileStore implements WeightedOptOutProfileStore {
  items: Map<string, WeightedOptOutProfile>;
  order: string[];

  constructor(items: Map<string, WeightedOptOutProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedOptOutProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedOptOutProfile): void {
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

  list(): WeightedOptOutProfile[] {
    const out: WeightedOptOutProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedOptOutProfileStore(): WeightedOptOutProfileStore {
  return new MemoryWeightedOptOutProfileStore(new Map<string, WeightedOptOutProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedOptOutProfileStore implements WeightedOptOutProfileStore {
  inner: WeightedOptOutProfileStore;
  cache: cache.TtlCache<WeightedOptOutProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedOptOutProfileStore,
    cacheValue: cache.TtlCache<WeightedOptOutProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedOptOutProfile | undefined {
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

  save(item: WeightedOptOutProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedOptOutProfile[] {
    return this.inner.list();
  }
}

export function newCachedWeightedOptOutProfileStore(inner: WeightedOptOutProfileStore, ttl: number, clockValue: clock.Clock): WeightedOptOutProfileStore {
  return new CachedWeightedOptOutProfileStore(
    inner,
    cache.newTtlCache<WeightedOptOutProfile>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted opt out profiles. Empty fields match all. */
export class WeightedOptOutProfileQuery {
  locale: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCapacity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedOptOutProfile): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedOptOutProfile[]): WeightedOptOutProfile[] {
    const matched = collections.filter(items, (candidate: WeightedOptOutProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedOptOutProfiles(store: WeightedOptOutProfileStore, query: WeightedOptOutProfileQuery): WeightedOptOutProfile[] {
  return query.apply(store.list());
}
