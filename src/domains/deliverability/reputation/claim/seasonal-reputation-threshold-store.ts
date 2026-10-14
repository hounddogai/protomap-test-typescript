import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

/** Keeps seasonal reputation thresholds by code. */
export interface SeasonalReputationThresholdStore {
  find(code: string): SeasonalReputationThreshold | undefined;
  save(item: SeasonalReputationThreshold): void;
  remove(code: string): boolean;
  list(): SeasonalReputationThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalReputationThresholdStore implements SeasonalReputationThresholdStore {
  items: Map<string, SeasonalReputationThreshold>;
  order: string[];

  constructor(items: Map<string, SeasonalReputationThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalReputationThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalReputationThreshold): void {
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

  list(): SeasonalReputationThreshold[] {
    const out: SeasonalReputationThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalReputationThresholdStore(): SeasonalReputationThresholdStore {
  return new MemorySeasonalReputationThresholdStore(new Map<string, SeasonalReputationThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalReputationThresholdStore implements SeasonalReputationThresholdStore {
  inner: SeasonalReputationThresholdStore;
  cache: cache.TtlCache<SeasonalReputationThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalReputationThresholdStore,
    cacheValue: cache.TtlCache<SeasonalReputationThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalReputationThreshold | undefined {
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

  save(item: SeasonalReputationThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalReputationThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalReputationThresholdStore(inner: SeasonalReputationThresholdStore, ttl: number, clockValue: clock.Clock): SeasonalReputationThresholdStore {
  return new CachedSeasonalReputationThresholdStore(
    inner,
    cache.newTtlCache<SeasonalReputationThreshold>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reputation thresholds. Empty fields match all. */
export class SeasonalReputationThresholdQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalReputationThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalReputationThreshold[]): SeasonalReputationThreshold[] {
    const matched = collections.filter(items, (candidate: SeasonalReputationThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalReputationThresholds(store: SeasonalReputationThresholdStore, query: SeasonalReputationThresholdQuery): SeasonalReputationThreshold[] {
  return query.apply(store.list());
}
