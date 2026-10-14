import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPostOverride } from "./weighted-post-override.js";

/** Keeps weighted post overrides by code. */
export interface WeightedPostOverrideStore {
  find(code: string): WeightedPostOverride | undefined;
  save(item: WeightedPostOverride): void;
  remove(code: string): boolean;
  list(): WeightedPostOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPostOverrideStore implements WeightedPostOverrideStore {
  items: Map<string, WeightedPostOverride>;
  order: string[];

  constructor(items: Map<string, WeightedPostOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPostOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPostOverride): void {
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

  list(): WeightedPostOverride[] {
    const out: WeightedPostOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPostOverrideStore(): WeightedPostOverrideStore {
  return new MemoryWeightedPostOverrideStore(new Map<string, WeightedPostOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPostOverrideStore implements WeightedPostOverrideStore {
  inner: WeightedPostOverrideStore;
  cache: cache.TtlCache<WeightedPostOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPostOverrideStore,
    cacheValue: cache.TtlCache<WeightedPostOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPostOverride | undefined {
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

  save(item: WeightedPostOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPostOverride[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPostOverrideStore(inner: WeightedPostOverrideStore, ttl: number, clockValue: clock.Clock): WeightedPostOverrideStore {
  return new CachedWeightedPostOverrideStore(inner, cache.newTtlCache<WeightedPostOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted post overrides. Empty fields match all. */
export class WeightedPostOverrideQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPostOverride): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPostOverride[]): WeightedPostOverride[] {
    const matched = collections.filter(items, (candidate: WeightedPostOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPostOverrides(store: WeightedPostOverrideStore, query: WeightedPostOverrideQuery): WeightedPostOverride[] {
  return query.apply(store.list());
}
