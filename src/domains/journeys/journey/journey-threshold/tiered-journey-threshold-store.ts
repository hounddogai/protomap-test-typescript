import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredJourneyThreshold } from "./tiered-journey-threshold.js";

/** Keeps tiered journey thresholds by code. */
export interface TieredJourneyThresholdStore {
  find(code: string): TieredJourneyThreshold | undefined;
  save(item: TieredJourneyThreshold): void;
  remove(code: string): boolean;
  list(): TieredJourneyThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredJourneyThresholdStore implements TieredJourneyThresholdStore {
  items: Map<string, TieredJourneyThreshold>;
  order: string[];

  constructor(items: Map<string, TieredJourneyThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredJourneyThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredJourneyThreshold): void {
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

  list(): TieredJourneyThreshold[] {
    const out: TieredJourneyThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredJourneyThresholdStore(): TieredJourneyThresholdStore {
  return new MemoryTieredJourneyThresholdStore(new Map<string, TieredJourneyThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredJourneyThresholdStore implements TieredJourneyThresholdStore {
  inner: TieredJourneyThresholdStore;
  cache: cache.TtlCache<TieredJourneyThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredJourneyThresholdStore,
    cacheValue: cache.TtlCache<TieredJourneyThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredJourneyThreshold | undefined {
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

  save(item: TieredJourneyThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredJourneyThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredJourneyThresholdStore(inner: TieredJourneyThresholdStore, ttl: number, clockValue: clock.Clock): TieredJourneyThresholdStore {
  return new CachedTieredJourneyThresholdStore(
    inner,
    cache.newTtlCache<TieredJourneyThreshold>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered journey thresholds. Empty fields match all. */
export class TieredJourneyThresholdQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredJourneyThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredJourneyThreshold[]): TieredJourneyThreshold[] {
    const matched = collections.filter(items, (candidate: TieredJourneyThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredJourneyThresholds(store: TieredJourneyThresholdStore, query: TieredJourneyThresholdQuery): TieredJourneyThreshold[] {
  return query.apply(store.list());
}
