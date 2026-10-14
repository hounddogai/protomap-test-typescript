import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWarmupThreshold } from "./seasonal-warmup-threshold.js";

/** Keeps seasonal warmup thresholds by code. */
export interface SeasonalWarmupThresholdStore {
  find(code: string): SeasonalWarmupThreshold | undefined;
  save(item: SeasonalWarmupThreshold): void;
  remove(code: string): boolean;
  list(): SeasonalWarmupThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWarmupThresholdStore implements SeasonalWarmupThresholdStore {
  items: Map<string, SeasonalWarmupThreshold>;
  order: string[];

  constructor(items: Map<string, SeasonalWarmupThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWarmupThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWarmupThreshold): void {
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

  list(): SeasonalWarmupThreshold[] {
    const out: SeasonalWarmupThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWarmupThresholdStore(): SeasonalWarmupThresholdStore {
  return new MemorySeasonalWarmupThresholdStore(new Map<string, SeasonalWarmupThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWarmupThresholdStore implements SeasonalWarmupThresholdStore {
  inner: SeasonalWarmupThresholdStore;
  cache: cache.TtlCache<SeasonalWarmupThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWarmupThresholdStore,
    cacheValue: cache.TtlCache<SeasonalWarmupThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWarmupThreshold | undefined {
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

  save(item: SeasonalWarmupThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWarmupThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWarmupThresholdStore(inner: SeasonalWarmupThresholdStore, ttl: number, clockValue: clock.Clock): SeasonalWarmupThresholdStore {
  return new CachedSeasonalWarmupThresholdStore(
    inner,
    cache.newTtlCache<SeasonalWarmupThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal warmup thresholds. Empty fields match all. */
export class SeasonalWarmupThresholdQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWarmupThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWarmupThreshold[]): SeasonalWarmupThreshold[] {
    const matched = collections.filter(items, (candidate: SeasonalWarmupThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWarmupThresholds(store: SeasonalWarmupThresholdStore, query: SeasonalWarmupThresholdQuery): SeasonalWarmupThreshold[] {
  return query.apply(store.list());
}
