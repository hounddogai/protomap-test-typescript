import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedInsightOverride } from "./weighted-insight-override.js";

/** Keeps weighted insight overrides by code. */
export interface WeightedInsightOverrideStore {
  find(code: string): WeightedInsightOverride | undefined;
  save(item: WeightedInsightOverride): void;
  remove(code: string): boolean;
  list(): WeightedInsightOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedInsightOverrideStore implements WeightedInsightOverrideStore {
  items: Map<string, WeightedInsightOverride>;
  order: string[];

  constructor(items: Map<string, WeightedInsightOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedInsightOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedInsightOverride): void {
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

  list(): WeightedInsightOverride[] {
    const out: WeightedInsightOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedInsightOverrideStore(): WeightedInsightOverrideStore {
  return new MemoryWeightedInsightOverrideStore(new Map<string, WeightedInsightOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedInsightOverrideStore implements WeightedInsightOverrideStore {
  inner: WeightedInsightOverrideStore;
  cache: cache.TtlCache<WeightedInsightOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedInsightOverrideStore,
    cacheValue: cache.TtlCache<WeightedInsightOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedInsightOverride | undefined {
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

  save(item: WeightedInsightOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedInsightOverride[] {
    return this.inner.list();
  }
}

export function newCachedWeightedInsightOverrideStore(inner: WeightedInsightOverrideStore, ttl: number, clockValue: clock.Clock): WeightedInsightOverrideStore {
  return new CachedWeightedInsightOverrideStore(
    inner,
    cache.newTtlCache<WeightedInsightOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted insight overrides. Empty fields match all. */
export class WeightedInsightOverrideQuery {
  source: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCost: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedInsightOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedInsightOverride[]): WeightedInsightOverride[] {
    const matched = collections.filter(items, (candidate: WeightedInsightOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedInsightOverrides(store: WeightedInsightOverrideStore, query: WeightedInsightOverrideQuery): WeightedInsightOverride[] {
  return query.apply(store.list());
}
