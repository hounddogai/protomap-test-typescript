import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyTier } from "./frequency-tier.js";

/** Keeps frequency tiers by code. */
export interface FrequencyTierStore {
  find(code: string): FrequencyTier | undefined;
  save(item: FrequencyTier): void;
  remove(code: string): boolean;
  list(): FrequencyTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyTierStore implements FrequencyTierStore {
  items: Map<string, FrequencyTier>;
  order: string[];

  constructor(items: Map<string, FrequencyTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyTier): void {
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

  list(): FrequencyTier[] {
    const out: FrequencyTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyTierStore(): FrequencyTierStore {
  return new MemoryFrequencyTierStore(new Map<string, FrequencyTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyTierStore implements FrequencyTierStore {
  inner: FrequencyTierStore;
  cache: cache.TtlCache<FrequencyTier>;
  hits: number;
  misses: number;

  constructor(inner: FrequencyTierStore, cacheValue: cache.TtlCache<FrequencyTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyTier | undefined {
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

  save(item: FrequencyTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyTier[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyTierStore(inner: FrequencyTierStore, ttl: number, clockValue: clock.Clock): FrequencyTierStore {
  return new CachedFrequencyTierStore(inner, cache.newTtlCache<FrequencyTier>(256, ttl, clockValue), 0, 0);
}

/** Selects frequency tiers. Empty fields match all. */
export class FrequencyTierQuery {
  region: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWeight: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyTier): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyTier[]): FrequencyTier[] {
    const matched = collections.filter(items, (candidate: FrequencyTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyTiers(store: FrequencyTierStore, query: FrequencyTierQuery): FrequencyTier[] {
  return query.apply(store.list());
}
